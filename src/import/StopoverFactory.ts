import {GTFSStop, GTFSStopTime} from "../db/GTFS";
import {Boarding, H3_RESOLUTION, Station, Stopover, Trip} from "../db/Schedule";
import {latLngToCell} from "h3-js";

export function createStopover(
    station: Station,
    trip: Trip,
    stopTime: GTFSStopTime,
    stop: GTFSStop,
    tripStopTimes: GTFSStopTime[] = [],
    h3_cell?: string
): Stopover {
    if (!stopTime.departure_time && !stopTime.arrival_time) {
        throw new Error('Stop time has no departure or arrival time')
    }

    const cell = h3_cell ?? latLngToCell(stop.stop_lat, stop.stop_lon, H3_RESOLUTION);

    if (
        stopTime.stop_id !== stop.stop_id
        || stopTime.trip_id !== trip.feed_trip_id
        || !station.h3_cells.includes(cell)
    ) {
        throw new Error('Data mismatch')
    }

    for (const tripStopTime of tripStopTimes) {
        if (tripStopTime.trip_id !== trip.feed_trip_id) {
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
        id: `${station.id}-${trip.id}`,
        station_id: station.id,
        trip_id: trip.id,
        route_type: trip.route_type,
        sequence_in_trip: stopTime.stop_sequence,
        minutes: minutesSum,
        h3_cell: cell,
        time: stopTime.departure_time ?? stopTime.departure_time,
        departure_time: is_destination ? undefined : stopTime.departure_time,
        arrival_time: is_origin ? undefined : stopTime.arrival_time,
        line: trip.name,
        direction: trip.direction,
        is_origin,
        is_destination,
        boarding,
        stop: stop.stop_name,
        station: station.name,
    };
}
