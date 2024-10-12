import {describe, expect, it} from "vitest";
import {CsvParser} from "./CsvParser";
import * as fs from "node:fs";
import * as path from "node:path";
import {GTFSTrip} from "../db/GTFS";

describe('CsvParser', () => {
    it('should parse trips from csv', async () => {
        const parser = new CsvParser(() => {})
        const fileContent = fs.readFileSync(path.resolve(__dirname + '../../../../testdata/trips.txt'))
        const lines: GTFSTrip[] = []
        await parser.parse<GTFSTrip>(new File([fileContent], 'trips.txt', {type: 'text/csv'}), chunk=> {
            lines.push(...chunk)
            return Promise.resolve()
        })
        expect(lines).toHaveLength(28162)
        expect(lines[0].trip_id).toEqual('1.TA.10-A10-j24-1.1.R')
    })
})