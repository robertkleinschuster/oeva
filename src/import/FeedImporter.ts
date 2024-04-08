import Papa, {ParseResult} from 'papaparse';
import JSZip from 'jszip';
import {Axios} from "axios";
import {GTFSDB} from '../db/GTFSDB';
import {getFiles, getTableName} from "../db/GTFSMapping";
import {FeedDB} from "../db/FeedDb";
import {FeedFileStatus, TransitFeedStatus, TransitFeedStep} from "../db/Feed";
import {ScheduleDB} from "../db/ScheduleDB";
import {FeedProcessor} from "./FeedProcessor";
import pako from "pako"

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

    constructor(private feedDb: FeedDB, private transitDb: GTFSDB, private scheduleDb: ScheduleDB, private axios: Axios) {
    }

    static async create(feedDb: FeedDB, url: string, name: string, is_ifopt: boolean) {
        return feedDb.transit.add({
            name,
            url,
            status: TransitFeedStatus.DRAFT,
            downloaded_megabytes: 0,
            download_progress: 0,
            timestamp: (new Date()).getTime()
        });
    }

    async run(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);

        this.feedDb.transit.update(feedId, {
            last_start: (new Date).getTime()
        });

        if (feed?.status === TransitFeedStatus.DOWNLOADING) {
            await this.downloadData(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.SAVING)
        }
        if (feed?.status === TransitFeedStatus.SAVING) {
            await this.importData(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.PROCESSING)
        }
        if (feed?.status === TransitFeedStatus.PROCESSING) {
            await this.processData(feedId)
        }
    }

    async updateStatus(feedId: number, status: TransitFeedStatus) {
        this.feedDb.transit.update(feedId, {
            status: status,
            step: undefined,
            offset: undefined,
            progress: undefined
        });
    }

    async downloadData(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }
        let downloaded_megabytes = 0
        let progress = 0;

        const interval = setInterval(async () => {
            await this.feedDb.transit.update(feedId, {
                downloaded_megabytes: downloaded_megabytes,
                download_progress: progress ? Math.round(progress * 100) : undefined,
                status: TransitFeedStatus.DOWNLOADING
            });
        }, 1500)

        try {
            const response = await this.axios.get(feed.url, {
                responseType: 'blob',
                onDownloadProgress: (event) => {
                    downloaded_megabytes = Math.ceil(event.loaded / 1000000);
                    if (event.progress) {
                        progress = event.progress
                    }
                }
            });

            await this.saveData(feedId, response.data);
        } finally {
            clearInterval(interval)
        }
    }

    async saveData(feedId: number, file: File | Blob) {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);

        const requiredGTFSFiles = getFiles();

        for (const fileName of requiredGTFSFiles) {
            const file = content.file(fileName)
            if (file) {
                const fileContent = await file.async('uint8array');
                await this.feedDb.file.put({
                    feed_id: feedId,
                    name: fileName,
                    type: 'text/csv',
                    content: pako.deflate(fileContent),
                    status: FeedFileStatus.IMPORT_PENDING,
                })
            }
        }
    }

    async importData(feedId: number) {
        const files = await this.feedDb.file
            .where({feed_id: feedId, status: FeedFileStatus.IMPORT_PENDING})
            .toArray();

        let done = await this.feedDb.file
            .where({feed_id: feedId, status: FeedFileStatus.IMPORTED})
            .count();
        const originalDone = done;

        if (!files.length) {
            throw new Error('No files in import');
        }

        for (const file of files) {
            await this.feedDb.transit.update(feedId, {
                progress: `${file.name}, ${done} / ${originalDone + files.length}`,
                status: TransitFeedStatus.SAVING
            });

            const tableName = getTableName(file.name);

            if (tableName) {
                await this.importCSV(pako.inflate(file.content, {to: "string"}), tableName);
            }

            await this.feedDb.file.update(file, {
                status: FeedFileStatus.IMPORTED
            })
            done++
        }
    }

    async processData(feedId: number): Promise<void> {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }
        const processor = new FeedProcessor(this.feedDb, this.transitDb, this.scheduleDb)

        if (feed.step === undefined) {
            await this.feedDb.transit.update(feedId, {
                step: TransitFeedStep.STOPS,
                offset: undefined
            });
        } else if (feed.step === TransitFeedStep.STOPS) {
            await processor.processStops(feedId)
            await this.feedDb.transit.update(feedId, {
                step: TransitFeedStep.TRIPS,
                offset: undefined
            });
        } else if (feed.step === TransitFeedStep.TRIPS) {
            await processor.processTrips(feedId)
            await this.feedDb.transit.update(feedId, {
                step: TransitFeedStep.TRIPSTOPS,
                offset: undefined
            });
        } else if (feed.step === TransitFeedStep.TRIPSTOPS) {
            await processor.processTripStops(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.DONE)
        }
    }

    private importCSV(csv: string, tableName: string) {
        const table = this.transitDb.table(tableName);
        return this.transitDb.transaction('rw', table, (trans) => {
            return new Promise<void>((resolve, reject) => {
                Papa.parse(csv, {
                    header: true,
                    dynamicTyping: (column) => {
                        return dynamicallyTypedColumns.has(column.toString());
                    },
                    skipEmptyLines: true,
                    chunkSize: 5000,
                    worker: false,
                    encoding: "UTF-8",
                    chunk: (results: ParseResult<object>, parser: Papa.Parser) => {
                        parser.pause();
                        const table = this.transitDb.table(tableName);
                        table.bulkPut(results.data)
                            .then(() => {
                                parser.resume()
                            })
                            .catch(() => {
                                trans.abort();
                                reject()
                            });
                    },
                    complete: () => {
                        resolve();
                    },
                    error: (error: Error) => {
                        trans.abort();
                        reject(error);
                    },
                });
            });
        })
    }
}


export {FeedImporter};
