import {addDays, format, parse, set} from "date-fns";

const DATE_FORMAT = 'yyyyMMdd';
const TIME_FORMAT = 'HH:mm:ss';

export function parseStopTime(time: string, referenceDate: Date): Date {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return set(addDays(new Date(referenceDate), Math.floor(hours / 24)), {hours: hours % 24, minutes, seconds})
}

export function formatStopTime(time: Date): string {
    return format(time, TIME_FORMAT)
}

export function parseServiceDate(date: string, referenceDate: Date): Date {
    return parse(String(date), DATE_FORMAT, referenceDate)
}

export function formatServiceDate(date: Date): string {
    return format(date, DATE_FORMAT)
}