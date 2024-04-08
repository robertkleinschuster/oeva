import {GTFSCalendar, GTFSCalendarDate, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../db/GTFS";
import {Boarding, Stop, TripStop, Trip, Weekday, H3_RESOLUTION} from "../db/Schedule";
import Tokenizer from "wink-tokenizer";
import {convertStopTimeToInt} from "../transit/DateTime";
import {latLngToCell} from "h3-js";
import {transliterate} from "transliteration";
import {H3Cell} from "../transit/H3Cell";
import {TransitFeed} from "../db/Feed";

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

    const time = stopTime.departure_time ?? stopTime.arrival_time ?? '00:00'
    const [hour, minute] = time.split(':').map(Number);

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
        feed_id: trip.feed_id,
        stop_id: stop.id,
        trip_id: trip.id,
        route_type: trip.route_type,
        sequence_in_trip: stopTime.stop_sequence,
        sequence_at_stop: hour * 60 + minute,
        hour: hour,
        h3_cell_le1: stop.h3_cell_le1,
        h3_cell_le2: stop.h3_cell_le2,
        departure_time: is_destination || stopTime.departure_time == undefined ? undefined : convertStopTimeToInt(stopTime.departure_time),
        arrival_time: is_origin || stopTime.arrival_time === undefined ? undefined : convertStopTimeToInt(stopTime.arrival_time),
        trip_name: trip.name,
        direction: trip.direction,
        is_origin,
        is_destination,
        boarding,
        stop_name: stop.name,
        stop_platform: stop.platform,
        service_start_date: trip.service_start_date,
        service_end_date: trip.service_end_date,
        service_exceptions: trip.service_exceptions,
        service_weekdays: trip.service_weekdays,
    };
}

const platformInStopNameRegex = /( [0-9]{1,2}| [A-X]| [0-9]{1,2}[a-d])$/
const platformCodeRegex = /([0-9]{1,2}|[A-X]|[0-9]{1,2}[a-d])$/
const tokenizer = new Tokenizer()

tokenizer.defineConfig({
    word: true,
    number: true,
    punctuation: true,
    ordinal: false,
    url: false,
    symbol: false,
    mention: false,
    time: false,
    emoji: false,
    email: false,
    emoticon: false,
    hashtag: false,
    currency: false,
    quoted_phrase: false
})

const cell = new H3Cell()

export function createStop(feed: TransitFeed, stop: GTFSStop): Stop {
    if (!feed.id) {
        throw new Error('Invalid feed')
    }

    const platform = stop.platform_code?.match(platformCodeRegex)?.pop() || stop.stop_name.match(platformInStopNameRegex)?.pop()

    const name = platform && stop.stop_name.endsWith(platform) ?
        stop.stop_name.substring(0, stop.stop_name.length - platform.length).trim() : stop.stop_name

    const keywords = tokenizer.tokenize(transliterate(name + ' ' + (feed.keywords ?? '')))
        .map(token => token.value)
        .filter(keyword => keyword.length > 1 || keyword.match(/[A-Za-z0-9]/));
    keywords.push(transliterate(name))
    keywords.push(transliterate(feed.name))

    cell.fromIndex(latLngToCell(stop.stop_lat, stop.stop_lon, H3_RESOLUTION))
    const cellIndex = cell.toIndexInput()

    return {
        id: `${feed.id}-${stop.stop_id}`,
        feed_id: feed.id,
        feed_name: feed.name,
        feed_stop_id: stop.stop_id,
        feed_parent_station: stop.parent_station === "" ? undefined : stop.parent_station,
        name: name,
        platform: platform?.trim(),
        keywords: keywords,
        h3_cell_le1: cellIndex[0] as number,
        h3_cell_le2: cellIndex[1] as number
    };
}


export function createTrip(feed: TransitFeed, trip: GTFSTrip, route: GTFSRoute, service: GTFSCalendar | undefined, exceptions: GTFSCalendarDate[]): Trip {
    if (!feed.id) {
        throw new Error('Invalid feed')
    }

    let name = trip.trip_short_name;

    if (!name) {
        name = route.route_short_name
    }

    if (!name) {
        name = route.route_long_name;
    }

    name = (name ?? '').trim();

    const keywords = tokenizer.tokenize(transliterate(name + ' ' + (feed.keywords ?? ''))).map(token => token.value);
    keywords.push(transliterate(name))
    keywords.push(transliterate(feed.name))

    let weekdays = 0;
    if (service) {
        weekdays += service.monday ? Weekday.Monday : 0;
        weekdays += service.tuesday ? Weekday.Tuesday : 0;
        weekdays += service.wednesday ? Weekday.Wednesday : 0;
        weekdays += service.thursday ? Weekday.Thursday : 0;
        weekdays += service.friday ? Weekday.Friday : 0;
        weekdays += service.saturday ? Weekday.Saturday : 0;
        weekdays += service.sunday ? Weekday.Sunday : 0;
    }

    return {
        id: `${feed.id}-${trip.trip_id}`,
        feed_id: feed.id,
        feed_name: feed.name,
        feed_trip_id: trip.trip_id,
        route_type: route.route_type,
        name: name,
        direction: trip.trip_headsign ?? '',
        keywords: keywords,
        service_exceptions: new Map(exceptions.map(exception => [exception.date, exception.exception_type])),
        service_start_date: service?.start_date,
        service_end_date: service?.end_date,
        service_weekdays: weekdays,
    }
}