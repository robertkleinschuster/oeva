import {GTFSCalendar, GTFSCalendarDate, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../db/GTFS";
import {Boarding, Stop, TripStop, Trip, H3_RESOLUTION} from "../db/Schedule";
import {latLngToCell} from "h3-js";
import Tokenizer from "wink-tokenizer";

export function createTripStop(
    trip: Trip,
    stop: Stop,
    stopTime: GTFSStopTime,
    tripStopTimes: GTFSStopTime[] = []
): TripStop {
    if (!stopTime.departure_time && !stopTime.arrival_time) {
        throw new Error('Stop time has no departure or arrival time')
    }

    if (
        trip.feed_trip_id !== stopTime.trip_id
        || stop.feed_stop_id !== stopTime.stop_id
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
        id: `${stop.id}-${trip.id}-${stopTime.stop_sequence}`,
        stop_id: stop.id,
        trip_id: trip.id,
        route_type: trip.route_type,
        sequence_in_trip: stopTime.stop_sequence,
        minutes: minutesSum,
        h3_cell: stop.h3_cell,
        time: stopTime.departure_time ?? stopTime.departure_time,
        departure_time: is_destination ? undefined : stopTime.departure_time,
        arrival_time: is_origin ? undefined : stopTime.arrival_time,
        trip_name: trip.name,
        direction: trip.direction,
        is_origin,
        is_destination,
        boarding,
        stop_name: stop.name,
        stop_platform: stop.platform
    };
}

const platformInStopNameRegex = /( [0-9]{1,2}| [A-X]| [0-9]{1,2}[a-d])$/
const platformCodeRegex = /([0-9]{1,2}|[A-X]|[0-9]{1,2}[a-d])$/
const tokenizer = new Tokenizer()
tokenizer.defineConfig({
    word: true,
    number: true,
    punctuation: true,
    ordinal: true,
})

export function createStop(feedId: number, stop: GTFSStop): Stop {
    const platform = stop.platform_code?.match(platformCodeRegex)?.pop() || stop.stop_name.match(platformInStopNameRegex)?.pop()
    const name = platform && stop.stop_name.endsWith(platform) ?
        stop.stop_name.substring(0, stop.stop_name.length - platform.length) : stop.stop_name

    return {
        id: `${feedId}-${stop.stop_id}`,
        feed_id: feedId,
        feed_stop_id: stop.stop_id,
        name: name.trim(),
        platform: platform?.trim(),
        keywords: tokenizer.tokenize(stop.stop_name).map(token => token.value),
        h3_cell: latLngToCell(stop.stop_lat, stop.stop_lon, H3_RESOLUTION),
    };
}


export function createTrip(feedId: number, trip: GTFSTrip, route: GTFSRoute, service: GTFSCalendar, exceptions: GTFSCalendarDate[]): Trip {
    return {
        id: `${feedId}-${trip.trip_id}`,
        feed_id: feedId,
        feed_trip_id: trip.trip_id,
        route_type: route.route_type,
        name: trip.trip_short_name ? trip.trip_short_name : route.route_short_name,
        direction: trip.trip_headsign ?? '',
        keywords: tokenizer.tokenize(`${trip.trip_short_name} ${route.route_short_name}`).map(token => token.value),
        service,
        exceptions: new Map(exceptions.map(exception => [exception.date, exception.exception_type])),
    }
}