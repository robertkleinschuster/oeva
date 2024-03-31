import {formatServiceDate, parseStopTime} from "./DateTime";
import {isServiceRunningOn} from "./Schedule";
import {GTFSCalendar, GTFSCalendarDate, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../db/GTFS";
import {scheduleDB} from "../db/ScheduleDB";
import {RouteType, Stopover} from "../db/Schedule";

export interface TripDetail {
    trip: GTFSTrip;
    route: GTFSRoute;
    service: GTFSCalendar;
    exception: GTFSCalendarDate | undefined;
    stops?: TripAtStop[];
}

export interface TripAtStop extends TripDetail {
    departure: Date | null;
    arrival: Date | null;
    isDestination: boolean;
    isOrigin: boolean;
    stop: GTFSStop;
    stopTime: GTFSStopTime;
}


export class StopoverRepository {
    async findByTrip(tripId: string): Promise<Stopover[]> {
        return scheduleDB.stopover
            .where('trip_id')
            .equals(tripId)
            .sortBy('sequence_in_trip')
    }

    async findByStation(stationId: string, date: Date, routeTypes?: RouteType[]): Promise<Stopover[]> {
        const station = await scheduleDB.station.get(stationId)
        if (!station) {
            throw new Error('Station not found')
        }
        if (routeTypes) {
            let filter = [];
            for (const cell of station.h3_cells) {
                for (const type of routeTypes) {
                    filter.push([cell, type])
                }
            }
            return scheduleDB.stopover
                .where('[h3_cell+route_type]')
                .anyOf(filter)
                .filter(stopover =>
                    isServiceRunningOn(stopover.service, stopover.exceptions.get(formatServiceDate(date)), date)
                    && stopover.departure_time ? parseStopTime(stopover.departure_time, date).getTime() >= date.getTime() : true
                )
                .sortBy('minutes')
        } else {
            return scheduleDB.stopover
                .where('h3_cell')
                .anyOf(station.h3_cells)
                .filter(stopover =>
                    isServiceRunningOn(stopover.service, stopover.exceptions.get(formatServiceDate(date)), date)
                    && (stopover.time ? parseStopTime(stopover.time, date) >= date : true)
                )
                .sortBy('minutes')
        }
    }
}


