import {H3_RESOLUTION, Stopover} from "../db/Schedule";
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

    prefixId(feedId: number, id: string) {
        return `${feedId}-${id}`
    }

    async processStopTimes(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found')
        }

        this.offset = feed.offset ?? 0

        const count = await this.transitDb.trips.count()

        const trips = await this.scheduleDb.trip.offset(this.offset).toArray()

        await this.feedDb.transit.update(feedId, {
            progress: "stopovers",
        });

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const trip = trips.at(this.offset - (feed.offset ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `stopovers ${percent} %, trip ${this.offset} / ${count}: ${trip?.name} ${trip?.direction}`,
                offset: this.offset
            });
        }, 1500)

        for (const trip of trips) {
            const stopovers: Stopover[] = [];

            const stopTimes = await this.transitDb.stopTimes
                .where({trip_id: trip.feed_trip_id})
                .toArray();

            for (const stopTime of stopTimes) {
                const stop = await this.transitDb.stops.get(stopTime.stop_id)
                const station = await this.scheduleDb.station.get(this.prefixId(feedId, stopTime.stop_id))
                if (stop && station) {
                    stopovers.push(createStopover(
                        station,
                        trip,
                        stopTime,
                        stop,
                        stopTimes
                    ))
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

        await this.feedDb.transit.update(feedId, {
            progress: "stations",
        });

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const stop = stops.at(this.offset - (feed.offset ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `stations ${percent} %, ${this.offset} / ${count}: ${stop?.stop_name}`,
                offset: this.offset
            });
        }, 1500);

        try {
            for (const stop of stops) {
                await this.scheduleDb.station.put({
                    id: this.prefixId(feedId, stop.stop_id),
                    feed_id: feedId,
                    feed_station_id: stop.stop_id,
                    name: stop.stop_name,
                    keywords: lunr.tokenizer(stop.stop_name).map(String),
                    h3_cell: latLngToCell(stop.stop_lat, stop.stop_lon, H3_RESOLUTION),
                })
                this.offset++;
            }
        } finally {
            clearInterval(interval)
        }
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

        await this.feedDb.transit.update(feedId, {
            progress: "trips",
        });

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const trip = trips.at(this.offset - (feed.offset ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `trips ${percent} %, ${this.offset} / ${count}: ${trip?.trip_short_name} ${trip?.trip_headsign}`,
                offset: this.offset
            });
        }, 1500);
        try {
            for (const trip of trips) {
                const route = await this.transitDb.routes.get(trip.route_id)
                const service = await this.transitDb.calendar.get(trip.service_id)
                const exceptions = await this.transitDb.calendarDates
                    .where('service_id')
                    .equals(trip.service_id)
                    .toArray()

                if (route && service) {
                    await this.scheduleDb.trip.put({
                        id: this.prefixId(feedId, trip.trip_id),
                        feed_id: feedId,
                        feed_trip_id: trip.trip_id,
                        route_type: route.route_type,
                        name: trip.trip_short_name ? trip.trip_short_name : route.route_short_name,
                        direction: trip.trip_headsign ?? '',
                        keywords: lunr.tokenizer(`${trip.trip_short_name} ${route.route_short_name}`).map(String),
                        service,
                        exceptions: new Map(exceptions.map(exception => [exception.date, exception.exception_type])),
                    })
                }
                this.offset++;
            }
        } finally {
            clearInterval(interval)
        }
    }
}
