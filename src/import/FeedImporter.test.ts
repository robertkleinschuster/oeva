import {FeedImporter} from './FeedImporter.ts';
import {GTFSDB} from '../db/GTFSDB.ts';
import {feedDb} from "../db/FeedDb.ts";
import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import axios from "axios";
import fs from 'fs';
import path from 'path';
import {TransitFeed, TransitFeedStatus} from "../db/Feed.ts";
import {scheduleDB} from "../db/ScheduleDB.ts";

jest.mock('../db/ScheduleDB.ts', () => {
    const mockTable = () => ({
        add: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        bulkPut: jest.fn(),
    });

    return {
        transitDB: {
            station: mockTable(),
            stopover: mockTable(),
            table: jest.fn()
        },
    };
});

const mockedScheduleDb = scheduleDB as jest.Mocked<typeof scheduleDB>;

jest.mock('../db/GTFSDB.ts', () => {
    const mockTable = () => ({
        add: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        bulkPut: jest.fn(),
    });

    return {
        GTFSDB: jest.fn(() => ({
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
        })),
    };
});

const transitDB = new GTFSDB(1)
const mockedTransitDb = transitDB as jest.Mocked<GTFSDB>;

jest.mock('../db/FeedDb.ts', () => {
    const mockTable = () => ({
        add: jest.fn<() => Promise<TransitFeed>>(),
        get: jest.fn(),
        update: jest.fn(),
        bulkPut: jest.fn(),
        put: jest.fn(),
    });

    return {
        feedDb: {
            transit: mockTable(),
            file: mockTable(),
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

        await FeedImporter.create(feedDb, url, name, true);

        // Verify if the add method was called with the correct parameters
        expect(feedDb.transit.add).toHaveBeenCalledWith({
            name,
            url,
            is_ifopt: true,
            timestamp: expect.any(Number),
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
            is_ifopt: false,
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

        const dataImporter = new FeedImporter(mockedFeedDb, mockedTransitDb, mockedScheduleDb, mockedAxios);
        await expect(dataImporter.downloadData(importId)).resolves.not.toThrow();

        // Verify axios was called with the correct URL
        expect(axios.get).toHaveBeenCalledWith(mockImportData.url, expect.anything());
    });
    test.skip('should import data successfully', async () => {
        const feedId = 1;
        const mockImportData: TransitFeed = {
            id: feedId,
            url: 'http://example.com/gtfs_example.zip',
            name: 'Test Data',
            is_ifopt: false,
            timestamp: 0,
            downloaded_megabytes: 0,
            download_progress: 0,
            status: TransitFeedStatus.IMPORTING
        };

        mockedFeedDb.transit.get.mockResolvedValue(mockImportData);
        // @ts-ignore
        mockedTransitDb.stops.bulkPut.mockResolvedValue([])
        mockedTransitDb.stops.update.mockResolvedValue(0)

        mockedTransitDb.table.mockReturnValue(mockedTransitDb.stops)

        const dataImporter = new FeedImporter(mockedFeedDb, mockedTransitDb, mockedScheduleDb, mockedAxios);
        await dataImporter.importData(feedId)

        expect(mockedFeedDb.transit.update).toHaveBeenNthCalledWith(
            1,
            feedId,
            {
                progress: 'agency.txt',
                status: TransitFeedStatus.IMPORTING
            }
        )

        expect(mockedFeedDb.transit.update).toHaveBeenNthCalledWith(
            2,
            feedId,
            {
                imported: ['agency.txt', 'stops.txt'],
            }
        )
        expect(mockedFeedDb.transit.update).toHaveBeenNthCalledWith(
            3,
            feedId,
            {
                progress: 'stops.txt',
                status: TransitFeedStatus.IMPORTING
            }
        )
        expect(mockedFeedDb.transit.update).toHaveBeenNthCalledWith(
            4,
            feedId,
            {
                imported: ['agency.txt', 'stops.txt'],
            }
        )
    });
    test('should throw an error if import data is not found', async () => {
        const feedId = 2;
        mockedFeedDb.transit.get.mockResolvedValue(null);

        const dataImporter = new FeedImporter(mockedFeedDb, mockedTransitDb, mockedScheduleDb, mockedAxios);
        await expect(dataImporter.downloadData(feedId)).rejects.toThrow('Feed not found');
    });
});


