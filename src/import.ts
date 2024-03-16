import Papa, {ParseResult} from 'papaparse';
import JSZip from 'jszip';
import {db} from './GTFSDB.ts';

const tableMap = new Map<string, string>
tableMap.set('agency.txt', 'agencies')
tableMap.set('stops.txt', 'stops')
tableMap.set('routes.txt', 'routes')
tableMap.set('trips.txt', 'trips')
tableMap.set('stop_times.txt', 'stopTimes')
tableMap.set('calendar.txt', 'calendar')
tableMap.set('calendar_dates.txt', 'calendarDates')
tableMap.set('frequencies.txt', 'frequencies')
tableMap.set('transfers.txt', 'transfers')
tableMap.set('levels.txt', 'levels')
tableMap.set('pathways.txt', 'pathways')

function importCSV(file: File, tableName: string) {
    return new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            chunkSize: 1000,
            worker: false,
            encoding: "UTF-8",
            chunk: async (results: ParseResult<any>, parser) => {
                try {
                    console.log(results.data.length)
                    parser.pause()
                    const table = db.table(tableName);
                    await table.bulkPut(results.data);
                    //await new Promise(resolve => setTimeout(resolve, 50))
                    parser.resume()
                } catch (error) {
                    reject(error);
                }
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


export async function prepareImport(importId: number, file: File | Blob) {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);
    const requiredGTFSFiles = Array.from(tableMap.keys())

    // Iterate over each file in the ZIP to collect actual GTFS files
    const fileNames = Object.keys(content.files)
        .filter((name) => requiredGTFSFiles.includes(name));

    const fileMap = new Map<string, Blob>

    for (let fileName of fileNames) {
        const fileContent = await content.files[fileName].async('blob');
        fileMap.set(fileName, fileContent)
    }

    db.import.update(importId, {
        files: fileMap
    })

    // Check for missing required files
    const missingFiles = requiredGTFSFiles
        .filter((requiredFile) => !fileNames.includes(requiredFile));

    return {
        savedFiles: Array.from(fileMap.keys()),
        missingFiles: missingFiles,
    };
}

export async function runImport(importId: number, progress?: (progress: number, filename: string) => void) {
    const importData = await db.import.get(importId)
    if (!importData) {
        throw new Error('Import not found')
    }

    if (!importData.files?.size) {
        throw new Error('No files in import')
    }

    for (let [fileName, fileContent] of importData.files.entries()) {
        if (importData.imported && importData.imported.includes(fileName)) {
            continue;
        }

        const imported = importData.imported ?? [];

        if (progress) {
            progress(Math.round((imported.length / importData.files.size) * 100), fileName)
        }

        const file = new File([fileContent], fileName, {type: 'text/csv'});
        const tableName = tableMap.get(file.name)

        if (tableName) {
            await importCSV(file, tableName)
        }

        imported.push(fileName)
        db.import.update(importId, {
            imported,
            done: imported.length === importData.files.size ? 1 : 0
        })
    }
}
