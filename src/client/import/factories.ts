import {GTFSCalendar, GTFSCalendarDate, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../db/GTFS";
import {Boarding, H3_RESOLUTION, RouteType} from "../db/Schedule";
import Tokenizer from "wink-tokenizer";
import {convertStopTimeToInt} from "../transit/DateTime";
import {latLngToCell} from "h3-js";
import {transliterate} from "transliteration";
import {TransitFeed} from "../db/Feed";
import {Exception, Service, Stop, Trip, TripStop} from "../db/schema";
import {Insertable} from "kysely";

export function createTripStop(
    feedId: number,
    tripId: string,
    stopTime: GTFSStopTime,
    tripStopTimes: GTFSStopTime[] = []
): TripStop {
    if (!stopTime.departure_time && !stopTime.arrival_time) {
        throw new Error('Stop time has no departure or arrival time')
    }

    const is_origin = tripStopTimes.length > 0 && stopTime.stop_id === tripStopTimes[0].stop_id
    const is_destination = tripStopTimes.length > 0 && stopTime.stop_id === tripStopTimes[tripStopTimes.length - 1].stop_id

    const time = stopTime.departure_time ?? stopTime.arrival_time ?? '00:00'
    const [hour, minute] = time.split(':').map(Number);

    let boarding = Boarding.STANDARD;

    if (stopTime.pickup_type === '1' && stopTime.drop_off_type === '1') {
        boarding = Boarding.NONE
    } else if (stopTime.pickup_type === '1' && stopTime.drop_off_type === '0') {
        boarding = Boarding.ONLY_DISEMBARKING
    } else if (stopTime.pickup_type === '0' && stopTime.drop_off_type === '1') {
        boarding = Boarding.ONLY_BOARDING
    } else if (stopTime.pickup_type === '2' || stopTime.drop_off_type === '2') {
        boarding = Boarding.ON_REQUEST
    } else if (stopTime.pickup_type === '3' || stopTime.drop_off_type === '3') {
        boarding = Boarding.ON_CALL
    }

    return {
        trip_stop_id: `${feedId}-${stopTime.stop_id}-${tripId}-${stopTime.stop_sequence}`,
        stop_id: `${feedId}-${stopTime.stop_id}`,
        trip_id: `${feedId}-${tripId}`,
        sequence_in_trip: Number.parseInt(stopTime.stop_sequence),
        sequence_at_stop: hour * 60 + minute,
        hour: hour,
        departure_time: is_destination || stopTime.departure_time == undefined ? null : convertStopTimeToInt(stopTime.departure_time),
        arrival_time: is_origin || stopTime.arrival_time == undefined ? null : convertStopTimeToInt(stopTime.arrival_time),
        is_origin,
        is_destination,
        boarding,
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

    return {
        stop_id: `${feed.id}-${stop.stop_id}`,
        feed_name: feed.name,
        feed_parent_station: stop.parent_station === "" ? null : stop.parent_station ?? null,
        stop_name: name,
        platform: platform?.trim() ?? null,
        keywords: keywords.map(keyword => keyword.toLowerCase()).join(','),
        h3_cell: latLngToCell(Number.parseFloat(stop.stop_lat), Number.parseFloat(stop.stop_lon), H3_RESOLUTION),
        lat: Number.parseFloat(stop.stop_lat),
        lon: Number.parseFloat(stop.stop_lon),
        last_used: null,
        favorite_order: null
    };
}


export function createTrip(feed: TransitFeed, gtfsTrip: GTFSTrip, route: GTFSRoute): Trip {
    if (!feed.id) {
        throw new Error('Invalid feed')
    }

    let name = gtfsTrip.trip_short_name;

    if (!name) {
        name = route.route_short_name
    }

    if (!name) {
        name = route.route_long_name;
    }

    name = (name ?? '').trim();

    const keywords = tokenizer.tokenize(transliterate(name + ' ' + (gtfsTrip.trip_headsign ?? '') + ' ' + (feed.keywords ?? ''))).map(token => token.value);
    keywords.push(transliterate(name))
    keywords.push(transliterate(feed.name))


    const trip: Trip = {
        trip_id: `${feed.id}-${gtfsTrip.trip_id}`,
        service_id: `${feed.id}-${gtfsTrip.service_id}`,
        feed_name: feed.name,
        feed_trip_id: gtfsTrip.trip_id,
        route_type: Number.parseInt(route.route_type),
        trip_name: name,
        line: route.route_short_name !== name ? route.route_short_name : null,
        direction: gtfsTrip.trip_headsign ?? '',
        keywords: keywords.map(keyword => keyword.toLowerCase()).join(','),
        number: null,
        category: null,
    }

    if (Number.parseInt(route.route_type) === RouteType.RAIL) {
        const matches = name.match(/(?<category>[A-Z]{1,3}) (?<number>[0-9]+)/)
        trip.category = matches?.groups?.category ?? null
        trip.number = matches?.groups?.number ?? null
        if (!matches) {
            const matches = name.match(/(?<number>^[0-9]+) /)
            trip.number = matches?.groups?.number ?? null
        }
    }

    return trip;
}

export const createService = (feed: TransitFeed, calendar: GTFSCalendar): Service => ({
    service_id: `${feed.id}-${calendar.service_id}`,
    feed_id: feed.id!,
    monday: calendar.monday === '1',
    tuesday: calendar.tuesday === '1',
    wednesday: calendar.wednesday === '1',
    thursday: calendar.thursday === '1',
    friday: calendar.friday === '1',
    saturday: calendar.saturday === '1',
    sunday: calendar.sunday === '1',
    start_date: Number.parseInt(calendar.start_date),
    end_date: Number.parseInt(calendar.end_date),
})

export const createException = (feed: TransitFeed, calendarDate: GTFSCalendarDate): Insertable<Exception> => ({
    service_id: `${feed.id}-${calendarDate.service_id}`,
    date: Number.parseInt(calendarDate.date),
    type: Number.parseInt(calendarDate.exception_type)
})