import {convertStopTimeToInt, parseServiceDate, parseStopTime, parseStopTimeInt} from "./DateTime";
import {formatISO, parseISO} from "date-fns";
import {describe, expect, it} from "vitest";

describe("DateTime", () => {
    it('adds days for hours greater then 24', () => {
        const date = parseISO('2020-01-01T00:00+01:00');
        expect(formatISO(date)).toEqual('2020-01-01T00:00:00+01:00')
        const result1 = parseStopTime('24:00:00', date)
        expect(formatISO(result1)).toEqual('2020-01-02T00:00:00+01:00')
        const result2 = parseStopTime('27:30:10', date)
        expect(formatISO(result2)).toEqual('2020-01-02T03:30:10+01:00')
        const result3 = parseStopTime('48:00:00', date)
        expect(formatISO(result3)).toEqual('2020-01-03T00:00:00+01:00')
    })
    it('should date time', () => {
        const result = parseServiceDate(20201231);
        expect(formatISO(result)).toEqual('2020-12-31T00:00:00+01:00')
    })
    it('should convert time integers to date', () => {
        const date = parseISO('2020-01-01T00:00+01:00');
        expect(formatISO(parseStopTimeInt(830, date))).toEqual('2020-01-01T08:30:00+01:00')
        expect(formatISO(parseStopTimeInt(2500, date))).toEqual('2020-01-02T01:00:00+01:00')
    })
    it('should convert time strings to integers', () => {
        expect(convertStopTimeToInt('08:30')).toEqual(830)
        expect(convertStopTimeToInt('14:00')).toEqual(1400)
        expect(convertStopTimeToInt('33:00')).toEqual(3300)
    })
})