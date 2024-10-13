import {FeedDB, feedDb} from "../shared/db/FeedDb";
import {db} from "./db/client";
import {CsvParser} from "../shared/import/CsvParser";
import {InsertObject, Kysely} from "kysely";
import {Database} from "../shared/db/schema";
import {TransitFeedStatus} from "../shared/db/Feed";
import {getDirectoryHandle} from "../shared/messages";
import {GTFSCalendar, GTFSCalendarDate, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../shared/gtfs-types";
import {createException, createService, createStop, createTrip, createTripStop} from "../shared/import/factories";
import {downloadFile, extractFile} from "./storage";

self.onmessage = (message) => {
    if (message.data.runFeedId) {
        const importer = new FeedImporter(feedDb, db, progress => {
            self.postMessage({progress})
        })
        importer.run(message.data.runFeedId).then(() => {
            self.postMessage({done: true})
        }).catch(error => {
            self.postMessage({error})
        });
    }
}

class FeedImporter {

    private csv: CsvParser

    constructor(private feedDb: FeedDB, private db: Kysely<Database>, private progress: (progress: string) => void) {
        this.csv = new CsvParser(progress)
    }

    async run(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);

        this.feedDb.transit.update(feedId, {
            last_start: (new Date).getTime()
        });

        if (feed?.status === TransitFeedStatus.DOWNLOADING) {
            await this.downloadData(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.EXTRACTING)
            return
        }

        if (feed?.status === TransitFeedStatus.EXTRACTING) {
            await this.extractData(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.IMPORTING)
            return
        }

        if (feed?.status === TransitFeedStatus.IMPORTING) {
            await this.importData(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.DONE)
            return
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
            this.progress(`${progress} % (${downloaded_megabytes} / ${total_megabytes} MB)`)
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
            file => this.progress(file)
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
                await this.bulkReplaceInto('stop', stops, saved => {
                    const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                    this.progress('stops.txt ' + percent + ' %')
                })
            }
        );

        await this.csv.parse<GTFSCalendar>(
            await (await directoryHandle.getFileHandle('calendar.txt')).getFile(),
            async (results, meta) => {
                const services = results.map(result => createService(feed, result))
                await this.bulkReplaceInto('service', services, saved => {
                    const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                    this.progress('calendar.txt ' + percent + ' %')
                })
            }
        );

        try {
            await this.csv.parse<GTFSCalendarDate>(
                await (await directoryHandle.getFileHandle('calendar_dates.txt')).getFile(),
                async (results, meta) => {
                    const exceptions = results.map(calendarDate => createException(feed, calendarDate))
                    await this.bulkReplaceInto('exception', exceptions, saved => {
                        const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                        this.progress('calendar_dates.txt ' + percent + ' %')
                    })
                }
            );
        } catch (error) {
            console.warn('calendar_dates.txt: ' + error)
        }


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
                await this.bulkReplaceInto('trip', trips, saved => {
                    const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                    this.progress('trips.txt ' + percent + ' %')
                })
            }
        );

        await this.csv.parse<GTFSStopTime>(
            await (await directoryHandle.getFileHandle('stop_times.txt')).getFile(),
            async (results, meta) => {
                const tripStops = results.map(stopTime => createTripStop(feedId, stopTime))
                await this.bulkReplaceInto('trip_stop', tripStops, saved => {
                    const percent = Math.round(((meta.cursor + saved) / meta.lines) * 100)
                    this.progress('stop_times.txt ' + percent + ' %')
                })
            }
        );
    }

    async bulkReplaceInto<T extends keyof Database & string>(table: T, values: InsertObject<Database, T>[], progress?: (saved: number) => void): Promise<void> {
        await this.db.transaction().execute(async trx => {
            let saved = 0
            while (values.length) {
                await trx.replaceInto(table)
                    .values(values.splice(0, 1000))
                    .execute()
                saved += 1000
                if (progress) {
                    progress(saved)
                }
            }
        })
    }
}