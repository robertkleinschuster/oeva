import {decodeIFOPT, encodeIFOPT} from "../transit/IFOPT";
import {H3_RESOLUTION, Station, Stopover} from "../db/Schedule";
import {ScheduleDB} from "../db/ScheduleDB";
import lunr from "lunr";
import {FeedDB} from "../db/FeedDb";
import {GTFSDB} from "../db/GTFSDB";
import {createStopover} from "./StopoverFactory";
import {latLngToCell} from "h3-js";

export class FeedProcessor {
    private offset: number = 0

    constructor(private feedDb: FeedDB, private transitDb: GTFSDB, private scheduleDb: ScheduleDB) {
    }

    async processStopTimes(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found')
        }

        this.offset = feed.offset ?? 0

        const count = await this.transitDb.trips.count()

        const trips = await this.transitDb.trips.offset(this.offset).toArray()

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const trip = trips.at(this.offset - (feed.offset ?? 0))
            const route = trip ? await this.transitDb.routes.get(trip.route_id) : undefined;
            await this.feedDb.transit.update(feedId, {
                progress: `stopovers ${percent} %, trip ${this.offset} / ${count}: ${route?.route_short_name} ${trip?.trip_short_name} ${trip?.trip_headsign}`,
                offset: this.offset
            });
        }, 1500)

        for (const trip of trips) {
            const stopovers: Stopover[] = [];

            const stopTimes = await this.transitDb.stopTimes
                .where({trip_id: trip.trip_id})
                .toArray();

            for (const stopTime of stopTimes) {
                const stop = await this.transitDb.stops.get(stopTime.stop_id)
                const stations = await this.scheduleDb.station
                    .where('stop_ids')
                    .equals(stopTime.stop_id)
                    .toArray()
                if (stop) {
                    const route = await this.transitDb.routes.get(trip.route_id)
                    const service = await this.transitDb.calendar.get(trip.service_id)
                    const exceptions = await this.transitDb.calendarDates
                        .where('service_id')
                        .equals(trip.service_id)
                        .toArray()
                    if (route && service) {
                        for (const station of stations) {
                            stopovers.push(createStopover(
                                stopTime,
                                stop,
                                trip,
                                route,
                                station,
                                stopTimes,
                                service,
                                exceptions
                            ))
                        }
                    }
                }
            }

            await this.scheduleDb.stopover.bulkPut(stopovers);
            this.offset++
        }

        clearInterval(interval)
    }

    async processStops(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found')
        }

        this.offset = feed.offset ?? 0;

        const count = await this.transitDb.stops
            .count()

        const stops = await this.transitDb.stops
            .offset(this.offset)
            .toArray()

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const stop = stops.at(this.offset - (feed.offset ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `stations ${percent} %, ${this.offset} / ${count}: ${stop?.stop_name}`,
                offset: this.offset
            });
        }, 1500);

        for (const stop of stops) {
            const stationId = feed.is_ifopt ? encodeIFOPT(decodeIFOPT(stop.stop_id), true) : stop.stop_id;

            const station: Station = await this.scheduleDb.station.get(stationId) ?? {
                id: stationId,
                name: stop.stop_name,
                keywords: [],
                stop_ids: [],
                h3_cells: [],
            }

            if (!station.h3_cells) {
                station.h3_cells = [];
            }
            if (!station.stop_ids) {
                station.stop_ids = []
            }
            if (!station.keywords) {
                station.keywords = [];
            }

            station.stop_ids.push(stop.stop_id)
            station.h3_cells.push(latLngToCell(stop.stop_lat, stop.stop_lon, H3_RESOLUTION))

            const keywords = new Set(station.keywords)
            for (const keyword of lunr.tokenizer(stop.stop_name).map(String)) {
                keywords.add(keyword)
            }
            station.keywords = Array.from(keywords)

            await this.scheduleDb.station.put(station)
            this.offset++;
        }
        clearInterval(interval)
    }

    async processTrips(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found')
        }

        this.offset = feed.offset ?? 0;

        const count = await this.transitDb.trips
            .count()

        const trips = await this.transitDb.trips
            .offset(this.offset)
            .toArray()

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const trip = trips.at(this.offset - (feed.offset ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `trips ${percent} %, ${this.offset} / ${count}: ${trip?.trip_short_name}`,
                offset: this.offset
            });
        }, 1500);

        for (const trip of trips) {
            const route = await this.transitDb.routes.get(trip.route_id)
            if (route) {
                await this.scheduleDb.trip.put({
                    id: trip.trip_id,
                    name: trip.trip_short_name ? trip.trip_short_name : route.route_short_name,
                    keywords: [],
                    stop_ids: []
                })
            }
            this.offset++;
        }
        clearInterval(interval)
    }
}
