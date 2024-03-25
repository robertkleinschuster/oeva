import Papa, {ParseResult} from 'papaparse';
import JSZip from 'jszip';
import {Axios} from "axios";
import {TransitDB} from '../db/TransitDB.ts';
import {getFiles, getTableName} from "../db/TransitMapping.ts";
import {FeedDB} from "../db/FeedDb.ts";
import {decodeIFOPT, encodeIFOPT} from "../transit/IFOPT.ts";
import {TransitFeedStatus} from "../db/Feed.ts";
import lunr from "lunr";
import {IndexableType} from "dexie";
import {StopTime} from "../db/Transit.ts";
import {scheduleDB} from "../db/ScheduleDB.ts";
import {createStopover} from "./StopoverFactory.ts";
import {Station} from "../db/Schedule.ts";
import {parseStopTime} from "../transit/DateTime.ts";

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

    constructor(private feedDb: FeedDB, private transitDb: TransitDB, private axios: Axios) {
    }

    async create(url: string, name: string, is_ifopt: boolean) {
        return this.feedDb.transit.add({
            name,
            url,
            files: null,
            imported: [],
            current_step: null,
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
            current_step: null,
            downloaded_megabytes: 0,
            download_progress: 0,
            status: TransitFeedStatus.DOWNLOADING,
        });
    }

    async startImport(feedId: number) {
        this.feedDb.transit.update(feedId, {
            imported: [],
            current_step: null,
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
            this.feedDb.transit.update(feedId, {
                status: TransitFeedStatus.IMPORTING
            });
        }
        if (feed?.status === TransitFeedStatus.IMPORTING) {
            await this.importData(feedId)
            this.feedDb.transit.update(feedId, {
                status: TransitFeedStatus.PROCESSING
            });
        }
        if (feed?.status === TransitFeedStatus.PROCESSING) {
            await this.processData(feedId)
            this.feedDb.transit.update(feedId, {
                status: TransitFeedStatus.DONE
            });
        }
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

        for (let fileName of fileNames) {
            const fileContent = await content.files[fileName].async('blob');
            fileMap.set(fileName, fileContent);
        }

        this.feedDb.transit.update(feedId, {
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

        for (let [fileName, fileContent] of feed.files.entries()) {
            if (imported.includes(fileName)) {
                continue;
            }

            this.feedDb.transit.update(feedId, {
                current_step: fileName,
                status: TransitFeedStatus.IMPORTING
            });

            const file = new File([fileContent], fileName, {type: 'text/csv'});
            const tableName = getTableName(file.name);

            if (tableName) {
                await this.importCSV(feedId, file, tableName);
            }

            imported.push(fileName);
            this.feedDb.transit.update(feedId, {
                imported,
                current_step: null,
            });
        }
    }

    async processData(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }

        await this.feedDb.transit.update(feedId, {
            current_step: 'stations'
        });

        const stopIds = await this.feedDb.dependency.where({
            feed: 'transit',
            table: 'stops',
            feed_id: feedId
        }).toArray(stops => stops.map(stop => stop.dependency_id))

        const stops = await this.transitDb.stops
            .where('stop_id')
            .anyOf(stopIds)
            .toArray()

        for (const stop of stops) {
            const stationId = feed.is_ifopt ? encodeIFOPT(decodeIFOPT(stop.stop_id), true) : stop.stop_id;

            const station: Station = await scheduleDB.station.get(stationId) ?? {
                id: stationId,
                name: stop.stop_name,
                keywords: [],
                latitude: stop.stop_lat,
                longitude: stop.stop_lon,
                stopIds: [],
                locations: []
            }

            station.stopIds.push(stop.stop_id)
            const keywords = new Set(station.keywords)
            for (const keyword of lunr.tokenizer(stop.stop_name).map(String)) {
                keywords.add(keyword)
            }
            station.keywords = Array.from(keywords)
            station.locations.push({
                latitude: stop.stop_lat,
                longitude: stop.stop_lon,
            })

            await scheduleDB.station.put(station)
            await this.transitDb.stops.update(stop, {
                parent_station: stationId
            })
        }

        await this.feedDb.transit.update(feedId, {
            current_step: 'stopovers'
        });

        const stopTimes = await this.transitDb.stopTimes
            .where('stop_id')
            .anyOf(stopIds)
            .sortBy('stop_sequence');

        const tripStopTimeMap = new Map<string, StopTime[]>()

        stopTimes.sort((a, b) => {
            const date = new Date()
            const timeA = a.departure_time ?? a.arrival_time;
            const timeB = b.departure_time ?? b.arrival_time;
            if (!timeA || !timeB) {
                return 0;
            }

            return parseStopTime(timeA, date).getTime() - parseStopTime(timeB, date).getTime()
        })

        for (const stopTime of stopTimes) {
            const tripStopTimes = tripStopTimeMap.get(stopTime.trip_id) ?? [];
            tripStopTimes.push(stopTime)
            tripStopTimeMap.set(stopTime.trip_id, tripStopTimes)
            if (tripStopTimeMap.size % 500 === 0) {
                await this.feedDb.transit.update(feedId, {
                    current_step: `stopovers loading trips ${tripStopTimeMap.size}`
                });
            }
        }

        await this.feedDb.transit.update(feedId, {
            current_step: `stopovers`
        });

        let sequence = 0;
        let tripCount = 0;
        let chunk = [];
        for (const tripStopTimes of tripStopTimeMap.values()) {
            tripCount++;
            for (const stopTime of tripStopTimes) {
                const trip = await this.transitDb.trips.get(stopTime.trip_id)
                const stop = await this.transitDb.stops.get(stopTime.stop_id)
                if (trip) {
                    const service = await this.transitDb.calendar.get(trip?.service_id)
                    const exceptions = await this.transitDb.calendarDates
                        .where('service_id')
                        .equals(trip.service_id)
                        .toArray()
                    const route = await this.transitDb.routes.get(trip.route_id)
                    const station = stop?.parent_station ? await scheduleDB.station.get(stop?.parent_station) : undefined

                    if (trip && stop && route && station && service) {
                        chunk.push(createStopover(stopTime, stop, trip, route, station, tripStopTimes, service, exceptions, sequence++))
                    }
                }
            }
            if (chunk.length >= 1000) {
                await scheduleDB.stopover.bulkPut(chunk)
                await this.feedDb.transit.update(feedId, {
                    current_step: `stopovers (trip ${tripCount} / ${tripStopTimeMap.size})`
                });
                chunk = []
            }
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
                chunk: (results: ParseResult<any>, parser) => {
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
