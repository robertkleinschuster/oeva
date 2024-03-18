import {DataImporter} from './DataImporter.ts';
import {db, Import} from './GTFSDB.ts';
import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import axios from "axios";
import fs from 'fs';
import path from 'path';

jest.mock('./GTFSDB.ts', () => {
    const mockTable = () => ({
        add: jest.fn<() => Promise<Import>>(),
        get: jest.fn(),
        update: jest.fn(),
        bulkPut: jest.fn(),
    });

    return {
        db: {
            agencies: mockTable(),
            stops: mockTable(),
            routes: mockTable(),
            trips: mockTable(),
            stopTimes: mockTable(),
            calendar: mockTable(),
            calendarDates: mockTable(),
            shapes: mockTable(),
            frequencies: mockTable(),
            transfers: mockTable(),
            levels: mockTable(),
            pathways: mockTable(),
            import: mockTable(),
            table: jest.fn()
        },
    };
});

const mockedDb = db as jest.Mocked<typeof db>;

jest.mock('axios', () => ({
    get: jest.fn<() => Promise<{ data: any }>>(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('DataImporter with mocked GTFSDB', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })
    test('createImport should interact with the database', async () => {
        const url = 'http://example.com/data.zip';
        const name = 'Test Import';
        const dataImporter = new DataImporter(mockedDb, mockedAxios);

        await dataImporter.createImport(url, name);

        // Verify if the add method was called with the correct parameters
        expect(db.import.add).toHaveBeenCalledWith({
            name,
            url,
            files: null,
            imported: null,
            done: 0,
            timestamp: expect.any(Number),
        });
    });
    test('should download data successfully', async () => {
        // Setup mock import data
        const importId = 1;
        const mockImportData: Import = {
            id: importId,
            url: 'http://example.com/data.zip',
            name: 'Test Data',
            imported: null,
            files: null,
            done: 0,
            timestamp: 0
        };

        // Mock the db.import.get to return the mock import data
        mockedDb.import.get.mockResolvedValue(mockImportData);

        const zipFilePath = path.resolve(__dirname, 'gtfs_example.zip');
        const zipFileBuffer = fs.readFileSync(zipFilePath);

        mockedAxios.get.mockResolvedValue(Promise.resolve({
            data: zipFileBuffer,
        }));

        const dataImporter = new DataImporter(mockedDb, mockedAxios);
        await expect(dataImporter.downloadData(importId, () => {
        })).resolves.not.toThrow();

        // Verify axios was called with the correct URL
        expect(axios.get).toHaveBeenCalledWith(mockImportData.url, expect.anything());
    });
    test('should import data successfully', async () => {
        const importId = 1;
        const mockImportData: Import = {
            id: importId,
            url: 'http://example.com/gtfs_example.zip',
            name: 'Test Data',
            imported: null,
            files: new Map<string, Blob>([
                ['agency.txt', new Blob(["route_id,agency_id,route_short_name,route_long_name,route_type\n1001,1,10,Example Route,3"], {type: 'text/csv'})],
                ['stops.txt', new Blob(["stop_id,stop_name,stop_lat,stop_lon\n1,Example Stop,50.0,-50.0"], {type: 'text/csv'})],
            ]),
            done: 0,
            timestamp: 0
        };

        mockedDb.import.get.mockResolvedValue(mockImportData);
        mockedDb.import.bulkPut.mockResolvedValue(importId)
        mockedDb.import.update.mockResolvedValue(importId)

        mockedDb.table.mockReturnValue(mockedDb.import)

        const dataImporter = new DataImporter(mockedDb, mockedAxios);
        await dataImporter.runImport(importId)

        expect(mockedDb.import.update).toHaveBeenNthCalledWith(
            1,
            importId,
            {
                imported: ['agency.txt', 'stops.txt'],
                done: 0
            }
        )
        expect(mockedDb.import.update).toHaveBeenNthCalledWith(
            2,
            importId,
            {
                imported: ['agency.txt', 'stops.txt'],
                done: 1
            }
        )
    });
    test('should throw an error if import data is not found', async () => {
        const importId = 2;
        mockedDb.import.get.mockResolvedValue(null);

        const dataImporter = new DataImporter(mockedDb, mockedAxios);
        await expect(dataImporter.downloadData(importId, () => {
        })).rejects.toThrow('Import not found');
    });

    test('prepareImport successfully processes a ZIP file', async () => {
        const importId = 1;

        const zipFilePath = path.resolve(__dirname, 'gtfs_example.zip');
        const zipFileBuffer = fs.readFileSync(zipFilePath);

        const mockFile = new Blob([zipFileBuffer], {type: 'application/zip'});

        const dataImporter = new DataImporter(mockedDb, mockedAxios);

        await dataImporter.prepareImport(importId, mockFile);

        expect(mockedDb.import.update).toHaveBeenCalledWith(importId, {
            files: new Map([
                ['agency.txt', expect.any(Blob)],
                ['stops.txt', expect.any(Blob)],
                ['routes.txt', expect.any(Blob)],
            ]),
        });
    });
});


