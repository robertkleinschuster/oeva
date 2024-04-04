import {formatServiceDate, parseStopTime} from "./DateTime";
import {isServiceRunningOn} from "./Schedule";
import {scheduleDB} from "../db/ScheduleDB";
import {Stopover} from "../db/Schedule";
import {gridDisk} from "h3-js";
import {getHours, getMinutes} from "date-fns";


export class StopoverRepository {
    async findByTrip(tripId: string): Promise<Stopover[]> {
        return scheduleDB.stopover
            .where('trip_id')
            .equals(tripId)
            .sortBy('sequence_in_trip')
    }

    async findByStation(stationId: string, date: Date, ringSize: number = 1, minutes = 60): Promise<Stopover[]> {
        const station = await scheduleDB.station.get(stationId)
        if (!station) {
            throw new Error('Station not found')
        }

        const cells = gridDisk(station.h3_cell, ringSize);

        const minutesStart = getHours(date) * 60 + getMinutes(date)

        const filter = [];
        for (let minute = minutesStart; minute <= minutesStart + minutes; minute++) {
            if (minute > 24 * 60) {
                break;
            }
            for (const cell of cells) {
                filter.push([cell, minute])
            }
        }

        const stopovers = await scheduleDB.stopover
            .where('[h3_cell+minutes]')
            .anyOf(filter)
            .filter(stopover => stopover.time ? parseStopTime(stopover.time, date) >= date : true)
            .sortBy('minutes')

        const runningStopovers = [];
        for (const stopover of stopovers) {
            const trip = await scheduleDB.trip.get(stopover.trip_id)
            const exceptionType = trip?.exceptions.get(formatServiceDate(date));

            const exception = exceptionType && trip ? {
                date: formatServiceDate(date),
                exception_type: exceptionType,
                service_id: trip.service.service_id
            } : undefined;

            if (trip && isServiceRunningOn(trip.service, exception, date)) {
                runningStopovers.push(stopover)
            }
        }

        return runningStopovers;
    }
}


