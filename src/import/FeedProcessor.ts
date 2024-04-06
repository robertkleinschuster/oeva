import {TripStop} from "../db/Schedule";
import {ScheduleDB} from "../db/ScheduleDB";
import {FeedDB} from "../db/FeedDb";
import {GTFSDB} from "../db/GTFSDB";
import {createStop, createTrip, createTripStop} from "./TripStopFactory";
import {as} from "vitest/dist/reporters-5f784f42";

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

        const trips = await this.transitDb.trips.offset(this.offset).toArray()

        await this.feedDb.transit.update(feedId, {
            progress: "trip stops",
        });

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const trip = trips.at(this.offset - (feed.offset ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `trip stops ${percent} %, trip ${this.offset} / ${count}: ${trip?.trip_short_name} ${trip?.trip_headsign}`,
                offset: this.offset
            });
        }, 1500)


        try {
            for (const gtfsTrip of trips) {
                const tripStops: TripStop[] = [];
                const stopTimes = await this.transitDb.stopTimes
                    .where({trip_id: gtfsTrip.trip_id})
                    .toArray();

                await this.scheduleDb.transaction(
                    'rw',
                    [this.scheduleDb.trip, this.scheduleDb.stop, this.scheduleDb.trip_stop],
                    async () => {
                        const trip = await this.scheduleDb.trip.get(`${feedId}-${gtfsTrip.trip_id}`)
                        if (trip) {
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
                        }
                        await this.scheduleDb.trip_stop.bulkPut(tripStops);
                        this.offset++
                    })
            }
        } finally {
            clearInterval(interval)
        }
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
            for (const trip of trips) {
                const [route, service, exceptions] = await this.transitDb.transaction(
                    'r',
                    [this.transitDb.routes, this.transitDb.calendar, this.transitDb.calendarDates],
                    async () => {
                        const route = await this.transitDb.routes.get(trip.route_id)
                        const service = await this.transitDb.calendar.get(trip.service_id)
                        const exceptions = await this.transitDb.calendarDates
                            .where('service_id')
                            .equals(trip.service_id)
                            .toArray()
                        return [route, service, exceptions]
                    }
                )

                if (route && service) {
                    await this.scheduleDb.trip.put(createTrip(feedId, trip, route, service, exceptions))
                }

                this.offset++;
            }
        } finally {
            clearInterval(interval)
        }
    }
}
