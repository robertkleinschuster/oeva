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

        const tripStops = []
        for (const filter of filters) {
            tripStops.push(...await scheduleDB.trip_stop
                .where('[h3_cell+hour]')
                .equals(filter)
                .toArray())
        }

        return tripStops
            .sort((a, b) => a.sequence_at_stop - b.sequence_at_stop)
            .filter(tripStop =>
            isTripStopActiveOn(tripStop, date)
        );
    }
}


