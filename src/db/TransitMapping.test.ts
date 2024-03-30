import { getTableName } from './TransitMapping';
import {describe, expect, it} from "vitest";
describe('TransitMapping', () => {
    it('should return the correct table name for a known GTFS file', () => {
        expect(getTableName('agency.txt')).toEqual('agencies');
        expect(getTableName('stops.txt')).toEqual('stops');
    });

    it('should return undefined for an unknown GTFS file', () => {
        expect(getTableName('unknown.txt')).toBeUndefined();
    });
});
