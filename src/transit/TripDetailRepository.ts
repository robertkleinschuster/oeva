import {transitDB} from "../db/TransitDB.ts";
import {formatServiceDate, parseStopTime} from "./DateTime.ts";
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


export class TripDetailRepository {
    async findById(tripId: string, date: Date): Promise<TripDetail> {
        const trip = await transitDB.trips.get(tripId);
        if (!trip) {
            throw new Error('Trip not found.')
        }
        const stopTimes = await transitDB.stopTimes.where({trip_id: tripId}).sortBy('stop_sequence');
        const route = await transitDB.routes.get(trip.route_id);
        const service = await transitDB.calendar.get(trip.service_id)

        if (!route || !service) {
            throw new Error('Missing dependencies for trip.')
        }

        const exception = await transitDB.calendarDates.get({
            service_id: service.service_id,
            date: formatServiceDate(date)
        });
        const stops = [];

        for (const stopTime of stopTimes) {
            stops.push(await this.findByIdAtStop(stopTime.trip_id, stopTime.stop_id, date))
        }

        return {
            trip,
            stops,
            route,
            service,
            exception
        }
    }

    async findByIdAtStop(tripId: string, stopId: string, date: Date): Promise<TripAtStop> {
        const stopTime = await transitDB.stopTimes.get({trip_id: tripId, stop_id: stopId})
        const trip = await transitDB.trips.get(tripId);

        if (!trip || !stopTime) {
            throw new Error('Trip not found.')
        }

        const service = await transitDB.calendar.get(trip.service_id);
        const route = await transitDB.routes.get(trip.route_id)
        const stop = await transitDB.stops.get(stopId)

        if (!route || !service || !stop) {
            throw new Error('Missing dependencies for trip.')
        }

        const exception = await transitDB.calendarDates.get({
            service_id: service.service_id,
            date: formatServiceDate(date)
        });

        const tripStopTimes = await transitDB.stopTimes.where({trip_id: trip.trip_id}).toArray()
        const isDestination = stopTime.stop_sequence === Math.max(...tripStopTimes.map(s => s.stop_sequence));
        const isOrigin = stopTime.stop_sequence === Math.min(...tripStopTimes.map(s => s.stop_sequence))

        return {
            departure: stopTime.departure_time && !isDestination ? parseStopTime(stopTime.departure_time, date) : null,
            arrival: stopTime.arrival_time && !isOrigin ? parseStopTime(stopTime.arrival_time, date) : null,
            trip: trip,
            route: route,
            stop: stop,
            stopTime: stopTime,
            service: service,
            exception: exception,
            isDestination: isDestination,
            isOrigin: isOrigin
        };
    }


    async findByStops(stationId: string, date: Date): Promise<Stopover[]> {
        const station = scheduleDB.station.get(stationId)
        if (!station) {
            throw new Error('Station not found')
        }

        return scheduleDB.stopover
            .where('station_id')
            .equals(stationId)
            .filter(stopover => isServiceRunningOn(stopover.service, stopover.exceptions.get(formatServiceDate(date)), date))
            .limit(10)
            .sortBy('sequence')
    }
}


