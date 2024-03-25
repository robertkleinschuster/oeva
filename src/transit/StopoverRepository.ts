import {transitDB} from "../db/TransitDB.ts";
import {formatServiceDate} from "./DateTime.ts";
import {isServiceRunningOn} from "./Schedule.ts";
import {Calendar, CalendarDate, Route, Stop, StopTime, Trip} from "../db/Transit.ts";
import {scheduleDB} from "../db/ScheduleDB.ts";
import {Stopover} from "../db/Schedule.ts";

export interface TripDetail {
    trip: Trip;
    route: Route;
    service: Calendar;
    exception: CalendarDate | undefined;
    stops?: TripAtStop[];
}

export interface TripAtStop extends TripDetail {
    departure: Date | null;
    arrival: Date | null;
    isDestination: boolean;
    isOrigin: boolean;
    stop: Stop;
    stopTime: StopTime;
}


export class StopoverRepository {
    async findTrip(tripId: string): Promise<Trip> {
        const trip = await transitDB.trips.get(tripId);
        if (!trip) {
            throw new Error('Trip not found.')
        }
        return trip;
    }

    async findByTrip(tripId: string, date: Date): Promise<Stopover[]> {
        return scheduleDB.stopover
            .where('trip_id')
            .equals(tripId)
            .filter(stopover => isServiceRunningOn(stopover.service, stopover.exceptions.get(formatServiceDate(date)), date))
            .sortBy('sequence')
    }

    async findByStation(stationId: string, date: Date): Promise<Stopover[]> {
        const station = scheduleDB.station.get(stationId)
        if (!station) {
            throw new Error('Station not found')
        }

        return scheduleDB.stopover
            .where('station_id')
            .equals(stationId)
            .filter(stopover => isServiceRunningOn(stopover.service, stopover.exceptions.get(formatServiceDate(date)), date))
            .sortBy('sequence')
    }
}


