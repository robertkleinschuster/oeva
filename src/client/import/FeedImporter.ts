import Papa, {ParseResult} from 'papaparse';
import JSZip from 'jszip';
import {GTFSDB} from '../db/GTFSDB';
import {getFiles, getTableName} from "../db/GTFSMapping";
import {FeedDB} from "../db/FeedDb";
import {TransitFeedStatus, TransitFeedStep} from "../db/Feed";
import {ScheduleDB} from "../db/ScheduleDB";
import {FeedProcessor} from "./FeedProcessor";
import {downloadFile, listFilesAndDirectories, readFile, writeFile} from "../fs/StorageManager";
import {getDirectoryHandle} from "../../shared/messages";
import {FeedRunner} from "./FeedRunner";

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

    constructor(private feedDb: FeedDB, private transitDb: GTFSDB, private scheduleDb: ScheduleDB, private runner: FeedRunner) {
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
            if (await this.importData(feedId)) {
                await this.updateStatus(feedId, TransitFeedStatus.PROCESSING)
            }
        }
        if (feed?.status === TransitFeedStatus.PROCESSING) {
            await this.processData(feedId)
        }
        if (feed?.status === TransitFeedStatus.PROCESSING_QUICK) {
            await this.processData(feedId, true)
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
        await this.updateStatus(feedId, TransitFeedStatus.SAVING)
        const files = await listFilesAndDirectories(await getDirectoryHandle('feeds/' + feedId))

        if (!files.size) {
            throw new Error('No files in import');
        }
        let done = 0
        for (const [path, file] of files) {
            this.runner.progress(`${path} (${done} / ${files.size})`);
            const tableName = getTableName(file.name);
            if (tableName) {
                await this.importCSV(
                    file,
                    tableName
                );
            }

            done++
        }
        return true;
    }

    async processData(feedId: number, skipTripStops = false): Promise<void> {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }
        const processor = new FeedProcessor(this.feedDb, this.transitDb, this.scheduleDb, this.runner)

        const updateProgress = async () => {
            await this.feedDb.transit.update(feedId, {
                offset: processor.offset
            });
        }
        const interval = setInterval(async () => {
            await updateProgress()
        }, 1500);

        try {
            if (feed.step === undefined) {
                await this.feedDb.transit.update(feedId, {
                    step: TransitFeedStep.STOPS,
                    offset: undefined
                });
            } else if (feed.step === TransitFeedStep.STOPS) {
                if (await processor.processStops(feedId)) {
                    await this.feedDb.transit.update(feedId, {
                        step: TransitFeedStep.TRIPS,
                        offset: undefined
                    });
                }
            } else if (feed.step === TransitFeedStep.TRIPS) {
                if (await processor.processTrips(feedId)) {
                    await this.feedDb.transit.update(feedId, {
                        step: TransitFeedStep.TRIPSTOPS,
                        offset: undefined
                    });
                }
            } else if (feed.step === TransitFeedStep.TRIPSTOPS && !skipTripStops) {
                if (await processor.processTripStops(feedId)) {
                    await this.updateStatus(feedId, TransitFeedStatus.DONE)
                }
            } else if (skipTripStops) {
                await this.updateStatus(feedId, TransitFeedStatus.DONE)
            }
        } finally {
            clearInterval(interval)
        }
    }

    private importCSV(csv: string | File, tableName: string) {
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
                chunk: (results: ParseResult<object>, parser: Papa.Parser) => {
                    parser.pause();
                    (new Promise(resolve => setTimeout(resolve, 10))).then(() => {
                        const table = this.transitDb.table(tableName);
                        table.bulkPut(results.data)
                            .then(() => {
                                parser.resume()
                            })
                            .catch(() => {
                                reject()
                            });
                    });
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
