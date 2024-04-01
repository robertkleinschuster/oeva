import {GTFSCalendar, GTFSCalendarDate, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../db/GTFS";
import {Boarding, H3_RESOLUTION, Station, Stopover} from "../db/Schedule";
import {latLngToCell} from "h3-js";

export function createStopover(
    stopTime: GTFSStopTime,
    stop: GTFSStop,
    trip: GTFSTrip,
    route: GTFSRoute,
    station: Station,
    tripStopTimes: GTFSStopTime[],
    service: GTFSCalendar,
    exceptions: GTFSCalendarDate[],
    h3_cell?: string
): Stopover {
    if (!stopTime.departure_time && !stopTime.arrival_time) {
        throw new Error('Stop time has no departure or arrival time')
    }

    if (
        stopTime.stop_id !== stop.stop_id
        || stopTime.trip_id !== trip.trip_id
        || trip.route_id !== route.route_id
        || !station.stop_ids.includes(stop.stop_id)
    ) {
        throw new Error('Data mismatch')
    }

    for (const tripStopTime of tripStopTimes) {
        if (tripStopTime.trip_id !== trip.trip_id) {
            throw new Error('Data mismatch')
        }
    }

    const sorted = [...tripStopTimes].sort((a, b) => a.stop_sequence - b.stop_sequence);

    const is_origin = sorted.length > 0 && stopTime.stop_id === sorted[0].stop_id
    const is_destination = sorted.length > 0 && stopTime.stop_id === sorted[sorted.length - 1].stop_id

    const time = stopTime.departure_time ?? stopTime.arrival_time

    let minutesSum = 0

    if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        minutesSum = hours * 60 + minutes
    }

    let boarding = Boarding.STANDARD;

    if (stopTime.pickup_type === 1 && stopTime.drop_off_type === 1) {
        boarding = Boarding.NONE
    } else if (stopTime.pickup_type === 1 && stopTime.drop_off_type === 0) {
        boarding = Boarding.ONLY_DISEMBARKING
    } else if (stopTime.pickup_type === 0 && stopTime.drop_off_type === 1) {
        boarding = Boarding.ONLY_BOARDING
    } else if (stopTime.pickup_type === 2 || stopTime.drop_off_type === 2) {
        boarding = Boarding.ON_REQUEST
    } else if (stopTime.pickup_type === 3 || stopTime.drop_off_type === 3) {
        boarding = Boarding.ON_CALL
    }

    return {
        station_id: station.id,
        stop_id: stopTime.stop_id,
        service_id: trip.service_id,
        trip_id: trip.trip_id,
        route_id: trip.route_id,
        route_type: route.route_type,
        sequence_in_trip: stopTime.stop_sequence,
        minutes: minutesSum,
        h3_cell: h3_cell ?? latLngToCell(stop.stop_lat, stop.stop_lon, H3_RESOLUTION),
        time: stopTime.departure_time ?? stopTime.departure_time,
        departure_time: is_destination ? undefined : stopTime.departure_time,
        arrival_time: is_origin ? undefined : stopTime.arrival_time,
        line: trip.trip_short_name ? trip.trip_short_name : route.route_short_name,
        direction: trip.trip_headsign,
        is_origin,
        is_destination,
        service,
        boarding,
        stop: stop.stop_name,
        station: station.name,
        exceptions: new Map(exceptions.map(exception => [exception.date, exception]))
    };
}
