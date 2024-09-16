import {ExceptionType} from "../db/GTFS";
import {parseServiceDate} from "./DateTime";
import {Exception} from "../db/schema";
import {Weekday} from "../db/Schedule";
import {Selectable} from "kysely";


export function extractExceptions(service_exceptions: Selectable<Exception>[], exceptionType: ExceptionType) {
    const dates = [];
    for (const exception of service_exceptions) {
        if (exception.type === exceptionType) {
            dates.push(parseServiceDate(exception.date))
        }
    }
    return dates;
}

export const weekdayNames = new Map([
    [Weekday.Monday, 'Mo.'],
    [Weekday.Tuesday, 'Di.'],
    [Weekday.Wednesday, 'Mi.'],
    [Weekday.Thursday, 'Do.'],
    [Weekday.Friday, 'Fr.'],
    [Weekday.Saturday, 'Sa.'],
    [Weekday.Sunday, 'So.'],
])