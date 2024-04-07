import {isTripStopActiveOn} from "./Schedule";
import {scheduleDB} from "../db/ScheduleDB";
import {TripStop} from "../db/Schedule";
import {gridDisk} from "h3-js";
import {H3Cell} from "./H3Cell";

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
        const cells = gridDisk([stop.h3_cell_le1, stop.h3_cell_le2], ringSize);
        const cellObj = new H3Cell()
        const filters = cells.map(cell => {
            cellObj.fromIndex(cell)
            return [...cellObj.toIndexInput(), hours]
        });

        const tripStops = new Map<string, TripStop>
        for (const filter of filters) {
            await scheduleDB.trip_stop
                .where('[h3_cell_le1+h3_cell_le2+hour]')
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


