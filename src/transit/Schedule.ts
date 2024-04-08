import {ExceptionType} from "../db/GTFS";
import {formatServiceDate} from "./DateTime";
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

