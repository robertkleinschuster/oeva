import { getTableName } from './GTFSMapping';
import {describe, expect, it} from "@jest/globals";
describe('GTFSMappings', () => {
    it('should return the correct table name for a known GTFS file', () => {
        expect(getTableName('agency.txt')).toEqual('agencies');
        expect(getTableName('stops.txt')).toEqual('stops');
    });

    it('should return undefined for an unknown GTFS file', () => {
        expect(getTableName('unknown.txt')).toBeUndefined();
    });
});
