import {FeedImporter} from './FeedImporter.ts';
import {transitDB} from '../db/TransitDB.ts';
import {feedDb} from "../db/FeedDb.ts";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import axios from "axios";
import fs from 'fs';
import path from 'path';
import {TransitFeed, TransitFeedStatus} from "../db/Feed.ts";

jest.mock('../db/TransitDB.ts', () => {
    const mockTable = () => ({
        add: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        bulkPut: jest.fn(),
    });

    return {
        transitDB: {
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

const mockedTransitDb = transitDB as jest.Mocked<typeof transitDB>;

jest.mock('../db/FeedDb.ts', () => {
    const mockTable = () => ({
        add: jest.fn<() => Promise<TransitFeed>>(),
        get: jest.fn(),
        update: jest.fn(),
        bulkPut: jest.fn(),
    });

    return {
        feedDb: {
            transit: mockTable(),
            dependency: mockTable(),
            table: jest.fn()
        },
    };
});

const mockedFeedDb = feedDb as jest.Mocked<typeof feedDb>;

jest.mock('axios', () => ({
    get: jest.fn<() => Promise<{ data: any }>>(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('FeedImporter', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })
    test('create should add a draft import', async () => {
        const url = 'http://example.com/data.zip';
        const name = 'Test Import';
        const dataImporter = new FeedImporter(mockedFeedDb, mockedTransitDb, mockedAxios);

        await dataImporter.create(url, name, true);

        // Verify if the add method was called with the correct parameters
        expect(feedDb.transit.add).toHaveBeenCalledWith({
            name,
            url,
            files: null,
            imported: [],
            is_ifopt: true,
            timestamp: expect.any(Number),
            current_step: null,
            download_progress: 0,
            downloaded_megabytes: 0,
            status: TransitFeedStatus.DRAFT
        });
    });
    test('should download data successfully', async () => {
        // Setup mock import data
        const importId = 1;
        const mockImportData: TransitFeed = {
            id: importId,
            url: 'http://example.com/data.zip',
            name: 'Test Data',
            imported: [],
            files: null,
            is_ifopt: false,
            current_step: null,
            timestamp: 0,
            downloaded_megabytes: 0,
            download_progress: 0,
            status: TransitFeedStatus.DOWNLOADING
        };

        // Mock the db.import.get to return the mock import data
        mockedFeedDb.transit.get.mockResolvedValue(mockImportData);

        const zipFilePath = path.resolve('__mocks__/gtfs_example.zip');
        const zipFileBuffer = fs.readFileSync(zipFilePath);

        mockedAxios.get.mockResolvedValue(Promise.resolve({
            data: zipFileBuffer,
        }));

        const dataImporter = new FeedImporter(mockedFeedDb, mockedTransitDb, mockedAxios);
        await expect(dataImporter.downloadData(importId)).resolves.not.toThrow();

        // Verify axios was called with the correct URL
        expect(axios.get).toHaveBeenCalledWith(mockImportData.url, expect.anything());
    });
    test('should import data successfully', async () => {
        const feedId = 1;
        const mockImportData: TransitFeed = {
            id: feedId,
            url: 'http://example.com/gtfs_example.zip',
            name: 'Test Data',
            imported: [],
            files: new Map<string, Blob>([
                ['agency.txt', new Blob(["route_id,agency_id,route_short_name,route_long_name,route_type\n1001,1,10,Example Route,3"], {type: 'text/csv'})],
                ['stops.txt', new Blob(["stop_id,stop_name,stop_lat,stop_lon\n1,Example Stop,50.0,-50.0"], {type: 'text/csv'})],
            ]),
            current_step: null,
            is_ifopt: false,
            timestamp: 0,
            downloaded_megabytes: 0,
            download_progress: 0,
            status: TransitFeedStatus.IMPORTING
        };

        mockedFeedDb.transit.get.mockResolvedValue(mockImportData);
        mockedFeedDb.dependency.bulkPut.mockResolvedValue(0);
        // @ts-ignore
        mockedTransitDb.stops.bulkPut.mockResolvedValue([])
        mockedTransitDb.stops.update.mockResolvedValue(0)

        mockedTransitDb.table.mockReturnValue(mockedTransitDb.stops)

        const dataImporter = new FeedImporter(mockedFeedDb, mockedTransitDb, mockedAxios);
        await dataImporter.importData(feedId)

        expect(mockedFeedDb.transit.update).toHaveBeenNthCalledWith(
            1,
            feedId,
            {
                current_step: 'agency.txt',
                status: TransitFeedStatus.IMPORTING
            }
        )

        expect(mockedFeedDb.transit.update).toHaveBeenNthCalledWith(
            2,
            feedId,
            {
                current_step: null,
                imported: ['agency.txt', 'stops.txt'],
            }
        )
        expect(mockedFeedDb.transit.update).toHaveBeenNthCalledWith(
            3,
            feedId,
            {
                current_step: 'stops.txt',
                status: TransitFeedStatus.IMPORTING
            }
        )
        expect(mockedFeedDb.transit.update).toHaveBeenNthCalledWith(
            4,
            feedId,
            {
                current_step: null,
                imported: ['agency.txt', 'stops.txt'],
            }
        )
    });
    test('should throw an error if import data is not found', async () => {
        const feedId = 2;
        mockedFeedDb.transit.get.mockResolvedValue(null);

        const dataImporter = new FeedImporter(mockedFeedDb, mockedTransitDb, mockedAxios);
        await expect(dataImporter.downloadData(feedId)).rejects.toThrow('Feed not found');
    });

    test('prepareImport successfully processes a ZIP file', async () => {
        const importId = 1;

        const zipFilePath = path.resolve('__mocks__/gtfs_example.zip');
        const zipFileBuffer = fs.readFileSync(zipFilePath);

        const mockFile = new Blob([zipFileBuffer], {type: 'application/zip'});

        const dataImporter = new FeedImporter(mockedFeedDb, mockedTransitDb, mockedAxios);

        await dataImporter.saveData(importId, mockFile);

        expect(mockedFeedDb.transit.update).toHaveBeenCalledWith(importId, {
            files: new Map([
                ['agency.txt', expect.any(Blob)],
                ['stops.txt', expect.any(Blob)],
                ['routes.txt', expect.any(Blob)],
            ]),
        });
    });
});


