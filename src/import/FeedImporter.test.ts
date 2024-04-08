import {FeedImporter} from './FeedImporter';
import {GTFSDB} from '../db/GTFSDB';
import {feedDb} from "../db/FeedDb";
import axios from "axios";
import fs from 'fs';
import path from 'path';
import {TransitFeed, TransitFeedStatus} from "../db/Feed";
import {scheduleDB} from "../db/ScheduleDB";
import {beforeEach, describe, expect, test, vi} from "vitest";

vi.mock('../db/ScheduleDB');
const mockedScheduleDb = vi.mocked(scheduleDB, true)
vi.mock('../db/GTFSDB');
const transitDB = new GTFSDB(1)
const mockedTransitDb = vi.mocked(transitDB, true);
vi.mock('../db/FeedDb');
const mockedFeedDb = vi.mocked(feedDb, true);
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true)

describe('FeedImporter', () => {
    beforeEach(() => {
        vi.resetAllMocks()
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
            timestamp: 0,
            downloaded_megabytes: 0,
            download_progress: 0,
            status: TransitFeedStatus.DOWNLOADING
        };

        // Mock the db.import.get to return the mock import data
        mockedFeedDb.transit.get.mockResolvedValue(mockImportData);

        const zipFilePath = path.resolve('testdata/gtfs_example.zip');
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
            timestamp: 0,
            downloaded_megabytes: 0,
            download_progress: 0,
            status: TransitFeedStatus.SAVING
        };

        mockedFeedDb.transit.get.mockResolvedValue(mockImportData);

        mockedTransitDb.stops.bulkPut.mockResolvedValue('')
        mockedTransitDb.stops.update.mockResolvedValue(0)

        mockedTransitDb.table.mockReturnValue(mockedTransitDb.stops)

        const dataImporter = new FeedImporter(mockedFeedDb, mockedTransitDb, mockedScheduleDb, mockedAxios);
        await dataImporter.importData(feedId)

        expect(mockedFeedDb.transit.update).toHaveBeenNthCalledWith(
            1,
            feedId,
            {
                progress: 'agency.txt',
                status: TransitFeedStatus.SAVING
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
                status: TransitFeedStatus.SAVING
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


