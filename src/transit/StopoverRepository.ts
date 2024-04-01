import {formatServiceDate, parseStopTime} from "./DateTime";
import {isServiceRunningOn} from "./Schedule";
import {scheduleDB} from "../db/ScheduleDB";
import {Stopover} from "../db/Schedule";


export class StopoverRepository {
    async findByTrip(tripId: string): Promise<Stopover[]> {
        return scheduleDB.stopover
            .where('trip_id')
            .equals(tripId)
            .sortBy('sequence_in_trip')
    }

    async findByStation(stationId: string, date: Date): Promise<Stopover[]> {
        const station = await scheduleDB.station.get(stationId)
        if (!station) {
            throw new Error('Station not found')
        }

        const tripIds = await scheduleDB.trip
            .where('h3_cells')
            .anyOf(station.h3_cells)
            .filter(trip =>
                isServiceRunningOn(trip.service, trip.exceptions.get(formatServiceDate(date)), date)
            )
            .primaryKeys()
            .then(ids => new Set(ids))

        return scheduleDB.stopover
            .where('h3_cell')
            .anyOf(station.h3_cells)
            .filter(stopover =>
                tripIds.has(stopover.trip_id)
                 && (stopover.time ? parseStopTime(stopover.time, date) >= date : true)
            )
            .sortBy('minutes')
    }
}


