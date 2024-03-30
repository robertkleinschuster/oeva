import {GTFSCalendar, GTFSCalendarDate} from "../db/GTFS";
import {formatServiceDate, parseServiceDate} from "./DateTime";

export enum ExceptionType {
    RUNNING = 1,
    NOT_RUNNING = 2
}

export function isServiceRunningOn(service: GTFSCalendar, exception: GTFSCalendarDate | undefined, date: Date): boolean {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = weekdays[date.getDay()] as keyof GTFSCalendar;

    if (exception) {
        if (exception.service_id !== service.service_id) {
            throw new Error('Schedule exception does not match service id')
        }
        if (exception.date !== formatServiceDate(date)) {
            throw new Error('Schedule exception does not match requested date')
        }
        if (exception.exception_type === ExceptionType.RUNNING) {
            return true;
        }
        if (exception.exception_type === ExceptionType.NOT_RUNNING) {
            return false;
        }
    }

    return service[dayOfWeek] === 1
        && date >= parseServiceDate(service.start_date, date)
        && date <= parseServiceDate(service.end_date, date);
}