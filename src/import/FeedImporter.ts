import Papa, {ParseResult} from 'papaparse';
import JSZip from 'jszip';
import {Axios} from "axios";
import {TransitDB} from '../db/TransitDB.ts';
import {getFiles, getTableName} from "../db/TransitMapping.ts";
import {FeedDB} from "../db/FeedDb.ts";
import {TransitFeedStatus, TransitFeedStep} from "../db/Feed.ts";
import {IndexableType} from "dexie";
import {ScheduleDB} from "../db/ScheduleDB.ts";
import {FeedProcessor} from "./FeedProcessor.ts";

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

const dependencyTables = new Set([
    'stops',
    'trips',
    'routes',
    'shapes',
    'agencies',
    'calendar',
    'levels',
    'pathways',
])

class FeedImporter {

    constructor(private feedDb: FeedDB, private transitDb: TransitDB, private scheduleDb: ScheduleDB, private axios: Axios) {
    }

    async create(url: string, name: string, is_ifopt: boolean) {
        return this.feedDb.transit.add({
            name,
            url,
            files: null,
            imported: [],
            is_ifopt: is_ifopt,
            status: TransitFeedStatus.DRAFT,
            downloaded_megabytes: 0,
            download_progress: 0,
            timestamp: (new Date()).getTime()
        });
    }

    async startDownload(feedId: number) {
        this.feedDb.transit.update(feedId, {
            imported: [],
            downloaded_megabytes: 0,
            download_progress: 0,
            status: TransitFeedStatus.DOWNLOADING,
        });
    }

    async startImport(feedId: number) {
        this.feedDb.transit.update(feedId, {
            imported: [],
            status: TransitFeedStatus.IMPORTING,
        });
    }

    async startOptimize(feedId: number) {
        this.feedDb.transit.update(feedId, {
            status: TransitFeedStatus.PROCESSING,
        });
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
            await this.updateStatus(feedId, TransitFeedStatus.PROCESSING)
        }
        if (feed?.status === TransitFeedStatus.PROCESSING) {
            await this.processData(feedId)
            await this.updateStatus(feedId, TransitFeedStatus.DONE)
        }
    }

    async updateStatus(feedId: number, status: TransitFeedStatus) {
        this.feedDb.transit.update(feedId, {
            status: status,
            step: undefined,
            index: undefined
        });
    }

    async downloadData(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }
        let downloaded_megabytes = 0
        const response = await this.axios.get(feed.url, {
            responseType: 'blob',
            onDownloadProgress: (event) => {
                const newMegabyts = Math.ceil(event.loaded / 1000000);
                if (newMegabyts - 5 > downloaded_megabytes) {
                    downloaded_megabytes = newMegabyts
                    this.feedDb.transit.update(feedId, {
                        downloaded_megabytes: downloaded_megabytes,
                        download_progress: event.progress ? Math.round(event.progress * 100) : undefined,
                        status: TransitFeedStatus.DOWNLOADING
                    });
                }
            }
        });

        await this.saveData(feedId, response.data);
    }

    async saveData(feedId: number, file: File | Blob) {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);
        const requiredGTFSFiles = getFiles();

        const fileNames = Object.keys(content.files)
            .filter((name) => requiredGTFSFiles.includes(name));

        const fileMap = new Map<string, Blob>();

        for (const fileName of fileNames) {
            const fileContent = await content.files[fileName].async('blob');
            fileMap.set(fileName, fileContent);
        }

        await this.feedDb.transit.update(feedId, {
            files: fileMap
        });

        const missingFiles = requiredGTFSFiles
            .filter((requiredFile) => !fileNames.includes(requiredFile));

        return {
            savedFiles: Array.from(fileMap.keys()),
            missingFiles: missingFiles,
        };
    }

    async importData(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }

        if (!feed.files?.size) {
            throw new Error('No files in import');
        }

        const imported = feed.imported ?? [];

        for (const [fileName, fileContent] of feed.files.entries()) {
            if (imported.includes(fileName)) {
                continue;
            }

            await this.feedDb.transit.update(feedId, {
                progress: fileName,
                status: TransitFeedStatus.IMPORTING
            });

            const file = new File([fileContent], fileName, {type: 'text/csv'});
            const tableName = getTableName(file.name);

            if (tableName) {
                await this.importCSV(feedId, file, tableName);
            }

            imported.push(fileName);
            await this.feedDb.transit.update(feedId, {
                imported,
                progress: undefined,
            });
        }
    }

    async processData(feedId: number): Promise<void> {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }
        const processor = new FeedProcessor(this.feedDb, this.transitDb, this.scheduleDb)
        if (feed.step === undefined || feed.step === TransitFeedStep.STATIONS) {
            await this.feedDb.transit.update(feedId, {
                step: TransitFeedStep.STATIONS,
                index: feed.step === undefined ? 0 : feed.index
            });
            await processor.processStops(feedId)
        }
        if (feed.step === undefined || feed.step === TransitFeedStep.STOPOVERS) {
            await this.feedDb.transit.update(feedId, {
                step: TransitFeedStep.STOPOVERS,
                index: feed.step === undefined ? 0 : feed.index
            });
            await processor.processStopTimes(feedId)
        }
    }

    private importCSV(feedId: number, file: File, tableName: string) {
        return new Promise<void>((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                dynamicTyping: (column) => {
                    return dynamicallyTypedColumns.has(column.toString());
                },
                skipEmptyLines: true,
                chunkSize: 5000,
                worker: false,
                encoding: "UTF-8",
                chunk: (results: ParseResult<object>, parser) => {
                    parser.pause();
                    const table = this.transitDb.table(tableName);
                    table.bulkPut(results.data, undefined, {allKeys: true})
                        .then((keys) => {
                            if (dependencyTables.has(tableName)) {
                                const dependencies = (keys as IndexableType[])
                                    .map(key => ({
                                        feed: 'transit',
                                        feed_id: feedId,
                                        dependency_id: key,
                                        table: tableName
                                    }))
                                this.feedDb.dependency.bulkPut(dependencies).then(() => {
                                    parser.resume()
                                })
                            } else {
                                parser.resume()
                            }
                        })
                        .catch(reject);
                },
                complete: () => {
                    resolve();
                },
                error: (error) => {
                    reject(error);
                },
            });
        });
    }
}


export {FeedImporter};
