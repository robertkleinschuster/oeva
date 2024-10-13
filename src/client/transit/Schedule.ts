import {ExceptionType} from "../db/gtfs-types";
import {parseServiceDate} from "./DateTime";
import {Exception} from "../db/schema";
import {Weekday, WeekdayCode} from "../db/enums";
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

export const weekdayCodes = new Map<Weekday, WeekdayCode>([
    [Weekday.Sunday, 'sunday'],
    [Weekday.Monday, 'monday'],
    [Weekday.Tuesday, 'tuesday'],
    [Weekday.Wednesday, 'wednesday'],
    [Weekday.Thursday, 'thursday'],
    [Weekday.Friday, 'friday'],
    [Weekday.Saturday, 'saturday'],
])