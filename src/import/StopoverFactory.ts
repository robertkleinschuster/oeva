import {Calendar, CalendarDate, Route, Stop, StopTime, Trip} from "../db/Transit.ts";
import {Stopover} from "../db/Schedule.ts";

export function createStopover(
    stopTime: StopTime,
    stop: Stop,
    trip: Trip,
    route: Route,
    tripStopTimes: StopTime[],
    service: Calendar,
    exceptions: CalendarDate[],
    sequence: number
): Stopover {
    if (!stop.parent_station) {
        throw new Error('Stop has no parent station')
    }

    if (!stopTime.departure_time && !stopTime.arrival_time) {
        throw new Error('Stop time has no departure or arrival time')
    }

    if (
        stopTime.stop_id !== stop.stop_id
        || stopTime.trip_id !== trip.trip_id
        || trip.route_id !== route.route_id
    ) {
        throw new Error('Data mismatch')
    }

    for (const tripStopTime of tripStopTimes) {
        if (tripStopTime.trip_id !== trip.trip_id) {
            throw new Error('Data mismatch')
        }
    }

    tripStopTimes.sort((a, b) => a.stop_sequence - b.stop_sequence);

    const is_origin = tripStopTimes.length > 0 && stopTime.stop_id === tripStopTimes[0].stop_id
    const is_destination = tripStopTimes.length > 0 && stopTime.stop_id === tripStopTimes[tripStopTimes.length - 1].stop_id

    return {
        station_id: stop.parent_station,
        stop_id: stopTime.stop_id,
        service_id: trip.service_id,
        trip_id: trip.trip_id,
        route_id: trip.route_id,
        sequence,
        departure_time: is_destination ? undefined : stopTime.departure_time,
        arrival_time: is_origin ? undefined : stopTime.arrival_time,
        line: trip.trip_short_name ? trip.trip_short_name : route.route_short_name,
        direction: trip.trip_headsign,
        is_origin,
        is_destination,
        service,
        exceptions: new Map(exceptions.map(exception => [exception.date, exception]))
    };
}
