import {ExceptionType} from "../db/GTFS";
import {formatServiceDate, parseServiceDate} from "./DateTime";
import {TripStop, Weekday} from "../db/Schedule";

function extractWeekday(date: Date): Weekday {
    switch (date.getDay()) {
        case 0: // Sunday
            return Weekday.Sunday;
        case 1: // Monday
            return Weekday.Monday;
        case 2: // Tuesday
            return Weekday.Tuesday;
        case 3: // Wednesday
            return Weekday.Wednesday;
        case 4: // Thursday
            return Weekday.Thursday;
        case 5: // Friday
            return Weekday.Friday;
        case 6: // Saturday
            return Weekday.Saturday;
        default:
            throw new Error("Invalid day");
    }
}

export function isTripStopActiveOn(tripStop: TripStop, date: Date): boolean {
    const dateAsInt = formatServiceDate(date);
    const exceptionType = tripStop.service_exceptions?.get(dateAsInt)
    if (exceptionType !== undefined) {
        if (exceptionType === ExceptionType.RUNNING) {
            return true
        }
        if (exceptionType === ExceptionType.NOT_RUNNING) {
            return false
        }
    }
    return tripStop.service_start_date !== undefined
        && tripStop.service_end_date !== undefined
        && dateAsInt >= tripStop.service_start_date
        && dateAsInt <= tripStop.service_end_date
        && (tripStop.service_weekdays & extractWeekday(date)) !== 0
}

export function extractWeekdays(service_weeekdays: number) {
    const weekdays = [];
    if (service_weeekdays & Weekday.Monday) {
        weekdays.push(Weekday.Monday)
    }
    if (service_weeekdays & Weekday.Tuesday) {
        weekdays.push(Weekday.Tuesday)
    }
    if (service_weeekdays & Weekday.Wednesday) {
        weekdays.push(Weekday.Wednesday)
    }
    if (service_weeekdays & Weekday.Thursday) {
        weekdays.push(Weekday.Thursday)
    }
    if (service_weeekdays & Weekday.Friday) {
        weekdays.push(Weekday.Friday)
    }
    if (service_weeekdays & Weekday.Saturday) {
        weekdays.push(Weekday.Saturday)
    }
    if (service_weeekdays & Weekday.Sunday) {
        weekdays.push(Weekday.Sunday)
    }
    return weekdays;
}

export function extractExceptions(service_exceptions: Map<number, ExceptionType>, exceptionType: ExceptionType) {
    const dates = [];
    for (const [date, type] of service_exceptions) {
        if (type === exceptionType) {
            dates.push(parseServiceDate(date))
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