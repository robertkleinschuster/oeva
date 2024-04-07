import {isTripStopActiveOn} from "./Schedule";
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

    async findByStop(stopId: string, date: Date, ringSize: number): Promise<TripStop[]> {
        const stop = await scheduleDB.stop.get(stopId)
        if (!stop) {
            throw new Error('Stop not found')
        }

        const hours = date.getHours();
        const cells = gridDisk(stop.h3_cell, ringSize);
        const filters = cells.map(cell => [cell, hours]);

        const tripStops = new Map<string, TripStop>
        for (const filter of filters) {
            await scheduleDB.trip_stop
                .where('[h3_cell+hour]')
                .equals(filter)
                .each(tripStop => {
                    if (isTripStopActiveOn(tripStop, date)) {
                        tripStops.set(tripStop.id, tripStop)
                    }
                })
        }

        return Array.from(tripStops.values())
            .sort((a, b) => a.sequence_at_stop - b.sequence_at_stop);
    }
}


