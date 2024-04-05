import {formatServiceDate} from "./DateTime";
import {isServiceRunningOn} from "./Schedule";
import {scheduleDB} from "../db/ScheduleDB";
import {TripStop} from "../db/Schedule";
import {gridDisk} from "h3-js";


export class TripStopRepository {
    async findByTrip(tripId: string): Promise<TripStop[]> {
        return scheduleDB.trip_stop
            .where('trip_id')
            .equals(tripId)
            .sortBy('sequence_in_trip')
    }

    async findByStop(stopId: string, date: Date, minutesFrom: number, minutesTo: number, ringSize: number): Promise<TripStop[]> {
        const stop = await scheduleDB.stop.get(stopId)
        if (!stop) {
            throw new Error('Stop not found')
        }

        const cells = new Set(gridDisk(stop.h3_cell, ringSize));

        const filter = [];
        for (let minute = minutesFrom; minute <= minutesTo; minute++) {
            if (minute > 99 * 60) {
                break;
            }
            for (const cell of cells) {
                filter.push([cell, minute])
            }
        }

        const tripStops = await scheduleDB.trip_stop
            .where('[h3_cell+minutes]')
            .anyOf(filter)
            .sortBy('minutes')

        const runningTripStops = [];
        for (const tripStop of tripStops) {
            const trip = await scheduleDB.trip.get(tripStop.trip_id)
            const exceptionType = trip?.exceptions.get(formatServiceDate(date));

            const exception = exceptionType && trip ? {
                date: formatServiceDate(date),
                exception_type: exceptionType,
                service_id: trip.service.service_id
            } : undefined;

            if (trip && isServiceRunningOn(trip.service, exception, date)) {
                runningTripStops.push(tripStop)
            }
        }

        return runningTripStops;
    }
}


