import {TripStop} from "../db/Schedule";
import {ScheduleDB} from "../db/ScheduleDB";
import {FeedDB} from "../db/FeedDb";
import {GTFSDB} from "../db/GTFSDB";
import {createStop, createTripStop} from "./TripStopFactory";
import Tokenizer from "wink-tokenizer";

export class FeedProcessor {
    private offset: number = 0

    constructor(private feedDb: FeedDB, private transitDb: GTFSDB, private scheduleDb: ScheduleDB) {
    }

    prefixId(feedId: number, id: string) {
        return `${feedId}-${id}`
    }

    async processTripStops(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found')
        }

        this.offset = feed.offset ?? 0

        const count = await this.transitDb.trips.count()

        const trips = await this.scheduleDb.trip.offset(this.offset).toArray()

        await this.feedDb.transit.update(feedId, {
            progress: "trip stops",
        });

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const trip = trips.at(this.offset - (feed.offset ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `trip stops ${percent} %, trip ${this.offset} / ${count}: ${trip?.name} ${trip?.direction}`,
                offset: this.offset
            });
        }, 1500)

        for (const trip of trips) {
            const tripStops: TripStop[] = [];

            const stopTimes = await this.transitDb.stopTimes
                .where({trip_id: trip.feed_trip_id})
                .toArray();

            for (const stopTime of stopTimes) {
                const stop = await this.scheduleDb.stop.get(this.prefixId(feedId, stopTime.stop_id))
                if (stop) {
                    tripStops.push(createTripStop(
                        trip,
                        stop,
                        stopTime,
                        stopTimes
                    ))
                }
            }

            await this.scheduleDb.trip_stop.bulkPut(tripStops);
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
            progress: "stops",
        });

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const stop = stops.at(this.offset - (feed.offset ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `stops ${percent} %, ${this.offset} / ${count}: ${stop?.stop_name}`,
                offset: this.offset
            });
        }, 1500);

        try {
            for (const stop of stops) {
                await this.scheduleDb.stop.put(createStop(feedId, stop))
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
            const tokenizer = new Tokenizer()
            tokenizer.defineConfig({
                word: true,
                number: true,
                punctuation: true,
                ordinal: true,
            })
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
                        keywords: tokenizer.tokenize(`${trip.trip_short_name} ${route.route_short_name}`).map(token => token.value),
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
