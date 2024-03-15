import Papa, {ParseResult} from 'papaparse';
import JSZip from 'jszip';
import {db} from './GTFSDB.ts';

export function importCSV(file: File, tableName: string) {
    return new Promise<void>((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            chunkSize: 1000,
            worker: false,
            chunk: async (results: ParseResult<any>, parser) => {
                try {
                    parser.pause()
                    const table = db.table(tableName);
                    await table.bulkPut(results.data);
                    await new Promise(resolve => setTimeout(resolve, 500))
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

export async function importAgencies(file: File) {
    await importCSV(file, 'agencies');
}

export async function importStops(file: File) {
    await importCSV(file, 'stops');
}

export async function importRoutes(file: File) {
    await importCSV(file, 'routes');
}

export async function importTrips(file: File) {
    await importCSV(file, 'trips');
}

export async function importStopTimes(file: File) {
    await importCSV(file, 'stopTimes');
}

export async function importCalendar(file: File) {
    await importCSV(file, 'calendar');
}

export async function importCalendarDates(file: File) {
    await importCSV(file, 'calendarDates');
}

export async function importFareAttributes(file: File) {
    await importCSV(file, 'fareAttributes');
}

export async function importFareRules(file: File) {
    await importCSV(file, 'fareRules');
}

export async function importShapes(file: File) {
    await importCSV(file, 'shapes');
}

export async function importFrequencies(file: File) {
    await importCSV(file, 'frequencies');
}

export async function importTransfers(file: File) {
    await importCSV(file, 'transfers');
}

export async function importFeedInfo(file: File) {
    await importCSV(file, 'feedInfo');
}

export async function importLevels(file: File) {
    await importCSV(file, 'levels');
}

export async function importPathways(file: File) {
    await importCSV(file, 'pathways');
}


const requiredGTFSFiles = [
    'agency.txt',
    'stops.txt',
    'routes.txt',
    'trips.txt',
    'stop_times.txt',
    'calendar.txt',
    'calendar_dates.txt',
    'fare_attributes.txt',
    'fare_rules.txt',
    'shapes.txt',
    'frequencies.txt',
    'transfers.txt',
    'feed_info.txt',
];

export async function importGTFSZip(file: File | Blob, progress?: (progress: number, filename: string) => void) {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);

    // Iterate over each file in the ZIP to collect actual GTFS files
    const fileNames = Object.keys(content.files).filter((name) => name.endsWith('.txt'));

    const importedFiles = [];
    for (let fileName of fileNames) {
        // Check if the file is a CSV (ignore other files/directories)
        if (fileName.endsWith('.txt')) {
            const fileContent = await content.files[fileName].async('blob');
            const newFile = new File([fileContent], fileName, {type: 'text/csv'});
            importedFiles.push(fileName)
            if (progress) {
                const fileNumber = fileNames.indexOf(fileName) + 1
                const fileCount = fileNames.length
                progress(fileNumber / fileCount * 100, fileName)
            }
            // Call the respective import function based on the file name
            switch (fileName) {
                case 'agency.txt':
                    await importAgencies(newFile);
                    break;
                case 'stops.txt':
                    await importStops(newFile);
                    break;
                case 'routes.txt':
                    await importRoutes(newFile);
                    break;
                case 'trips.txt':
                    await importTrips(newFile);
                    break;
                case 'stop_times.txt':
                    await importStopTimes(newFile);
                    break;
                case 'calendar.txt':
                    await importCalendar(newFile);
                    break;
                case 'calendar_dates.txt':
                    await importCalendarDates(newFile);
                    break;
                case 'fare_attributes.txt':
                    await importFareAttributes(newFile);
                    break;
                case 'fare_rules.txt':
                    await importFareRules(newFile);
                    break;
//                case 'shapes.txt':
//                    await importShapes(newFile);
//                    break;
                case 'frequencies.txt':
                    await importFrequencies(newFile);
                    break;
                case 'transfers.txt':
                    await importTransfers(newFile);
                    break;
                case 'feed_info.txt':
                    await importFeedInfo(newFile);
                    break;
                case 'levels.txt':
                    await importLevels(newFile);
                    break;
                case 'pathways.txt':
                    await importPathways(newFile);
                    break;
                default:
                    importedFiles.pop()

            }
        }
    }

    // Check for missing required files
    const missingFiles = requiredGTFSFiles.filter((requiredFile) => !fileNames.includes(requiredFile));

    return {
        importedFiles: importedFiles,
        missingFiles: missingFiles,
    };
}
