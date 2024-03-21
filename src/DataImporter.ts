import Papa, {ParseResult} from 'papaparse';
import JSZip from 'jszip';
import {Axios} from "axios";
import {GTFSDB} from './GTFSDB.ts';
import {getFiles, getTableName} from "./GTFSMapping.ts";

class DataImporter {

    constructor(private db: GTFSDB, private axios: Axios) {
    }

    async createImport(url: string, name: string) {
        return this.db.import.add({
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

    async restartImport(importId: number) {
        this.db.import.update(importId, {
            files: null,
            imported: null,
            current_file: null,
            done: 0,
            downloading: 0,
            downloaded_bytes: 0,
            download_progress: 0,
        });
    }

    async run(importId: number) {
        const importData = await this.db.import.get(importId);
        if (!importData?.files) {
            await this.downloadData(importId)
        }
        await this.runImport(importId)
    }

    async downloadData(importId: number) {
        const importData = await this.db.import.get(importId);
        if (!importData) {
            throw new Error('Import not found');
        }

        this.db.import.update(importId, {
            downloading: 1
        });

        const response = await this.axios.get(importData.url, {
            responseType: 'blob',
            onDownloadProgress: (event) => {
                this.db.import.update(importId, {
                    downloaded_bytes: event.loaded,
                    download_progress: event.progress
                });
            }
        });
        await this.prepareImport(importId, response.data);

        this.db.import.update(importId, {
            downloading: 0
        });
    }

    async prepareImport(importId: number, file: File | Blob) {
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

        this.db.import.update(importId, {
            files: fileMap
        });

        const missingFiles = requiredGTFSFiles
            .filter((requiredFile) => !fileNames.includes(requiredFile));

        return {
            savedFiles: Array.from(fileMap.keys()),
            missingFiles: missingFiles,
        };
    }

    async runImport(importId: number) {
        const importData = await this.db.import.get(importId);
        if (!importData) {
            throw new Error('Import not found');
        }

        if (!importData.files?.size) {
            throw new Error('No files in import');
        }

        const imported = importData.imported ?? [];

        for (let [fileName, fileContent] of importData.files.entries()) {
            if (imported.includes(fileName)) {
                continue;
            }

            this.db.import.update(importId, {
                current_file: fileName
            });

            const file = new File([fileContent], fileName, {type: 'text/csv'});
            const tableName = getTableName(file.name);

            if (tableName) {
                await this.importCSV(file, tableName);
            }

            imported.push(fileName);
            this.db.import.update(importId, {
                imported,
                current_file: null,
                done: imported.length === importData.files.size ? 1 : 0
            });
        }
    }

    private importCSV(file: File, tableName: string) {
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
                    const table = this.db.table(tableName);
                    table.bulkPut(results.data)
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


export {DataImporter};
