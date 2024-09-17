import Papa, {ParseResult} from 'papaparse';
import JSZip from 'jszip';
import {getFiles} from "../db/GTFSMapping";
import {FeedDB} from "../db/FeedDb";
import {TransitFeedStatus} from "../db/Feed";
import {downloadFile, readFile, writeFile} from "../fs/StorageManager";
import {getDirectoryHandle} from "../../shared/messages";
import {FeedRunner} from "./FeedRunner";
import {createStop, createTrip, createTripStop} from "./TripStopFactory";
import {GTFSCalendar, GTFSCalendarDate, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../db/GTFS";
import {db} from "../db/client";
import {Exception, Service} from "../db/schema";
import {Insertable} from "kysely";

const dynamicallyTypedColumns = new Set([
    'stop_lat',
    'stop_lon',
    'location_type',
    'route_type',
    'route_sort_order',
    'continuous_pickup',
    'continuous_drop_off',
    'direction_id',
    'wheelchair_accessible',
    'bikes_allowed',
    'stop_sequence',
    'pickup_type',
    'drop_off_type',
    'shape_dist_traveled',
    'timepoint',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
    'start_date',
    'end_date',
    'date',
    'exception_type',
    'shape_pt_lat',
    'shape_pt_lon',
    'shape_pt_sequence',
    'headway_secs',
    'exact_times',
    'transfer_type',
    'min_transfer_time',
    'pathway_mode',
    'traversal_time',
])

class FeedImporter {

    constructor(private feedDb: FeedDB, private runner: FeedRunner) {
    }

    async run(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);

        this.feedDb.transit.update(feedId, {
            last_start: (new Date).getTime()
        });

        if (feed?.status === TransitFeedStatus.DOWNLOADING) {
            await this.downloadData(feedId)
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
            step: undefined,
            offset: undefined,
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

        await this.extractData(feedId, await readFile('feeds', feed.id + '.zip'));
    }

    async extractData(feedId: number, file: File | Blob) {
        await this.updateStatus(feedId, TransitFeedStatus.EXTRACTING)

        const zip = new JSZip();
        const content = await zip.loadAsync(file);

        const requiredGTFSFiles = getFiles();

        for (const fileName of requiredGTFSFiles) {
            const file = content.file(fileName)
            if (file) {
                this.runner.progress(fileName)
                const fileContent = await file.async('blob');
                await writeFile('feeds/' + feedId, new File(
                    [fileContent],
                    fileName,
                    {type: 'text/csv',}
                ))
            }
        }
    }

    async importData(feedId: number) {
        await this.updateStatus(feedId, TransitFeedStatus.IMPORTING)
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }

        const directoryHandle = await getDirectoryHandle('feeds/' + feedId)
        await this.importCSV<GTFSStop>(
            await (await directoryHandle.getFileHandle('stops.txt')).getFile(),
            async results => {
                const stops = results.data.map(stop => createStop(feed, stop))
                while (stops.length) {
                    await db.replaceInto('stop')
                        .values(stops.splice(0, 1000))
                        .execute()
                }
            }
        );

        await this.importCSV<GTFSCalendar>(
            await (await directoryHandle.getFileHandle('calendar.txt')).getFile(),
            async results => {
                const services = results.data.map(calendar => ({
                    service_id: `${feedId}-${calendar.service_id}`,
                    feed_id: feedId,
                    monday: Boolean(calendar.monday),
                    tuesday: Boolean(calendar.tuesday),
                    wednesday: Boolean(calendar.wednesday),
                    thursday: Boolean(calendar.thursday),
                    friday: Boolean(calendar.friday),
                    saturday: Boolean(calendar.saturday),
                    sunday: Boolean(calendar.sunday),
                    start_date: calendar.start_date,
                    end_date: calendar.end_date,
                } satisfies Service))
                while (services.length) {
                    await db.replaceInto('service')
                        .values(services.splice(0, 1000))
                        .execute()
                }

            }
        );

        await this.importCSV<GTFSCalendarDate>(
            await (await directoryHandle.getFileHandle('calendar_dates.txt')).getFile(),
            async results => {
                const exceptions = results.data.map(calendarDate => ({
                    service_id: `${feedId}-${calendarDate.service_id}`,
                    date: calendarDate.date,
                    type: calendarDate.exception_type
                } satisfies Insertable<Exception>))
                while (exceptions.length) {
                    await db.replaceInto('exception')
                        .values(exceptions.splice(0, 1000))
                        .execute()
                }
            }
        );

        const routes = new Map<string, GTFSRoute>();

        await this.importCSV<GTFSRoute>(
            await (await directoryHandle.getFileHandle('routes.txt')).getFile(),
            async results => {
                for (const route of results.data) {
                    routes.set(route.route_id, route)
                }
            }
        );


        await this.importCSV<GTFSTrip>(
            await (await directoryHandle.getFileHandle('trips.txt')).getFile(),
            async results => {
                const trips = results.data.map(trip => {
                    const route = routes.get(trip.route_id)
                    if (!route) {
                        throw new Error('Route not found')
                    }
                    return createTrip(feed, trip, route)
                })

                while (trips.length) {
                    await db.replaceInto('trip')
                        .values(trips.splice(0, 1000))
                        .execute()
                }
            }
        );

        const tripStopTimes = new Map<string, GTFSStopTime[]>();

        await this.importCSV<GTFSStopTime>(
            await (await directoryHandle.getFileHandle('stop_times.txt')).getFile(),
            async results => {
                for (const stopTime of results.data) {
                    const stopTimes = tripStopTimes.has(stopTime.trip_id) ? tripStopTimes.get(stopTime.trip_id) ?? [] : []
                    stopTimes.push(stopTime)
                    tripStopTimes.set(stopTime.trip_id, stopTimes)
                }
            }
        );

        const tripStops = []
        let count = 0;
        for (const [tripId, stopTimes] of tripStopTimes) {
            for (const stopTime of stopTimes) {
                tripStops.push(createTripStop(feedId, tripId, stopTime, stopTimes))
                count++;
                while (tripStops.length >= 1000) {
                    await db.replaceInto('trip_stop')
                        .values(tripStops.splice(0, 1000))
                        .execute()
                    this.runner.progress('trip_stop: ' + count)
                }
            }
        }

        while (tripStops.length) {
            await db.replaceInto('trip_stop')
                .values(tripStops.splice(0, 1000))
                .execute()
        }
    }

    private importCSV<T>(csv: File, pump: (results: ParseResult<T>) => Promise<void>) {
        this.runner.progress(csv.name)
        let count = 0;
        return new Promise<void>((resolve, reject) => {
            Papa.parse(csv, {
                header: true,
                dynamicTyping: (column) => {
                    return dynamicallyTypedColumns.has(column.toString());
                },
                skipEmptyLines: true,
                chunkSize: 655360,
                worker: false,
                encoding: "UTF-8",
                chunk: (results: ParseResult<T>, parser: Papa.Parser) => {
                    parser.pause();
                    pump(results).then(() => parser.resume()).catch(reject)
                    count += results.data.length
                    this.runner.progress(csv.name + ': ' + count)
                },
                complete: () => {
                    resolve();
                },
                error: (error: Error) => {
                    reject(error);
                },
            });
        })
    }
}


export {FeedImporter};
