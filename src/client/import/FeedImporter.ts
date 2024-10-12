import {FeedDB} from "../db/FeedDb";
import {TransitFeedStatus} from "../db/Feed";
import {downloadFile, extractFile} from "../fs/StorageManager";
import {getDirectoryHandle} from "../../shared/messages";
import {FeedRunner} from "./FeedRunner";
import {createException, createService, createStop, createTrip, createTripStop} from "./factories";
import {GTFSCalendar, GTFSCalendarDate, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../db/GTFS";
import {bulkReplaceInto} from "../db/client";
import {CsvParser} from "./CsvParser";

class FeedImporter {

    private csv: CsvParser

    constructor(private feedDb: FeedDB, private runner: FeedRunner) {
        this.csv = new CsvParser(progress => runner.progress(progress))
    }

    async run(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);

        this.feedDb.transit.update(feedId, {
            last_start: (new Date).getTime()
        });

        if (feed?.status === TransitFeedStatus.DOWNLOADING) {
            await this.downloadData(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.EXTRACTING)
        }

        if (feed?.status === TransitFeedStatus.EXTRACTING) {
            await this.extractData(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.IMPORTING)
        }

        if (feed?.status === TransitFeedStatus.IMPORTING) {
            await this.importData(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.DONE)
        }
    }

    async updateStatus(feedId: number, status: TransitFeedStatus) {
        this.feedDb.transit.update(feedId, {
            status: status,
        });
    }

    async downloadData(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }

        await this.updateStatus(feedId, TransitFeedStatus.DOWNLOADING)

        await downloadFile(feed.url, 'feeds', feed.id + '.zip', (progress, bytes, total) => {
            const downloaded_megabytes = Math.ceil(bytes / 1000000);
            const total_megabytes = Math.ceil(total / 1000000);
            this.runner.progress(`${progress} % (${downloaded_megabytes} / ${total_megabytes} MB)`)
        })
    }

    async extractData(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }

        await this.updateStatus(feedId, TransitFeedStatus.EXTRACTING)
        await extractFile(
            'feeds',
            feedId + '.zip',
            'feeds/' + feedId,
            file => this.runner.progress(file)
        )
    }

    async importData(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }
        await this.updateStatus(feedId, TransitFeedStatus.IMPORTING)

        const directoryHandle = await getDirectoryHandle('feeds/' + feedId)
        await this.csv.parse<GTFSStop>(
            await (await directoryHandle.getFileHandle('stops.txt')).getFile(),
            async (results, meta) => {
                const stops = results.map(stop => createStop(feed, stop))
                await bulkReplaceInto('stop', stops, saved => {
                    const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                    this.runner.progress('stops.txt ' + percent + ' %')
                })
            }
        );

        await this.csv.parse<GTFSCalendar>(
            await (await directoryHandle.getFileHandle('calendar.txt')).getFile(),
            async (results, meta) => {
                const services = results.map(result => createService(feed, result))
                await bulkReplaceInto('service', services, saved => {
                    const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                    this.runner.progress('calendar.txt ' + percent + ' %')
                })
            }
        );

        await this.csv.parse<GTFSCalendarDate>(
            await (await directoryHandle.getFileHandle('calendar_dates.txt')).getFile(),
            async (results, meta) => {
                const exceptions = results.map(calendarDate => createException(feed, calendarDate))
                await bulkReplaceInto('exception', exceptions, saved => {
                    const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                    this.runner.progress('calendar_dates.txt ' + percent + ' %')
                })
            }
        );

        const routes = new Map<string, GTFSRoute>();

        await this.csv.parse<GTFSRoute>(
            await (await directoryHandle.getFileHandle('routes.txt')).getFile(),
            async results => {
                for (const route of results) {
                    routes.set(route.route_id, route)
                }
            }
        );

        await this.csv.parse<GTFSTrip>(
            await (await directoryHandle.getFileHandle('trips.txt')).getFile(),
            async (results, meta) => {
                const trips = results.map(trip => {
                    const route = routes.get(trip.route_id)
                    if (!route) {
                        throw new Error('Route not found')
                    }
                    return createTrip(feed, trip, route)
                })
                await bulkReplaceInto('trip', trips, saved => {
                    const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                    this.runner.progress('trips.txt ' + percent + ' %')
                })
            }
        );

        await this.csv.parse<GTFSStopTime>(
            await (await directoryHandle.getFileHandle('stop_times.txt')).getFile(),
            async (results, meta) => {
                const tripStops = results.map(stopTime => createTripStop(feedId, stopTime))
                await bulkReplaceInto('trip_stop', tripStops, saved => {
                    const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                    this.runner.progress('stop_times.txt ' + percent + ' %')
                })
            }
        );
    }
}


export {FeedImporter};
