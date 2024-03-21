import Papa, {ParseResult} from 'papaparse';
import JSZip from 'jszip';
import {Axios} from "axios";
import {TransitDB} from '../db/TransitDB.ts';
import {getFiles, getTableName} from "../db/TransitMapping.ts";
import {FeedDB} from "../db/FeedDb.ts";

class FeedImporter {

    constructor(private feedDb: FeedDB, private transitDb: TransitDB, private axios: Axios) {
    }

    async createImport(url: string, name: string) {
        return this.feedDb.transit.add({
            name,
            url,
            files: null,
            imported: null,
            current_file: null,
            done: 0,
            downloading: 0,
            downloaded_bytes: 0,
            download_progress: 0,
            timestamp: (new Date()).getTime()
        });
    }

    async restartImport(feedId: number) {
        this.feedDb.transit.update(feedId, {
            files: null,
            imported: null,
            current_file: null,
            done: 0,
            downloading: 0,
            downloaded_bytes: 0,
            download_progress: 0,
        });
    }

    async run(feedId: number) {
        const importData = await this.feedDb.transit.get(feedId);
        if (!importData?.files) {
            await this.downloadData(feedId)
        }
        await this.runImport(feedId)
    }

    async downloadData(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found');
        }

        this.feedDb.transit.update(feedId, {
            downloading: 1
        });

        const response = await this.axios.get(feed.url, {
            responseType: 'blob',
            onDownloadProgress: (event) => {
                this.feedDb.transit.update(feedId, {
                    downloaded_bytes: event.loaded,
                    download_progress: event.progress
                });
            }
        });
        await this.prepareImport(feedId, response.data);

        this.feedDb.transit.update(feedId, {
            downloading: 0
        });
    }

    async prepareImport(feedId: number, file: File | Blob) {
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

    async runImport(feedId: number) {
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
                current_file: fileName
            });

            const file = new File([fileContent], fileName, {type: 'text/csv'});
            const tableName = getTableName(file.name);

            if (tableName) {
                await this.importCSV(feedId, file, tableName);
            }

            imported.push(fileName);
            this.feedDb.transit.update(feedId, {
                imported,
                current_file: null,
                done: imported.length === feed.files.size ? 1 : 0
            });
        }
    }

    private importCSV(feedId: number, file: File, tableName: string) {
        return new Promise<void>((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                chunkSize: 5000,
                worker: false,
                encoding: "UTF-8",
                chunk: (results: ParseResult<any>, parser) => {
                    parser.pause();
                    const table = this.transitDb.table(tableName);
                    table.bulkPut(results.data.map(item => ({...item, feed_id: feedId})))
                        .then(() => parser.resume())
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
