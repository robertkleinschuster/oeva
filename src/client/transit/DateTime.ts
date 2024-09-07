import {addDays, format, parse, set} from "date-fns";

const DATE_FORMAT = 'yyyyMMdd';

export function parseStopTimeString(time: string, referenceDate: Date): Date {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return set(addDays(new Date(referenceDate), Math.floor(hours / 24)), {hours: hours % 24, minutes, seconds})
}

export function parseStopTimeInt(time: number, referenceDate: Date): Date {
    const hours = time / 100;
    const minutes = time % 100;
    return set(addDays(new Date(referenceDate), Math.floor(hours / 24)), {hours: hours % 24, minutes})
}

export function formatDisplayTime(time: number, referenceDate: Date): string {
    const date = parseStopTimeInt(time, referenceDate);
    if (format(date, 'd.M.yyyy') !== format(new Date(), 'd.M.yyyy')) {
        return format(date, 'd.M.yyyy HH:mm')
    }
    return format(date, 'HH:mm')
}

export function convertStopTimeToInt(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 100 + minutes;
}

export function parseServiceDate(date: number): Date {
    return parse(String(date), DATE_FORMAT, 0)
}

export function formatServiceDate(date: Date): number {
    return Number.parseInt(format(date, DATE_FORMAT))
}