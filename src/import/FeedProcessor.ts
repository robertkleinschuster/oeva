import {decodeIFOPT, encodeIFOPT} from "../transit/IFOPT.ts";
import {Station, Stopover} from "../db/Schedule.ts";
import {ScheduleDB} from "../db/ScheduleDB.ts";
import lunr from "lunr";
import {FeedDB} from "../db/FeedDb.ts";
import {TransitDB} from "../db/TransitDB.ts";
import {createStopover} from "./StopoverFactory.ts";
import {parseStopTime} from "../transit/DateTime.ts";

export class FeedProcessor {
    private offset: number = 0

    constructor(private feedDb: FeedDB, private transitDb: TransitDB, private scheduleDb: ScheduleDB) {
    }

    async processStopTimes(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found')
        }
        const date = new Date()

        this.offset = feed.index ?? 0

        const count = await this.feedDb.dependency
            .where('[feed+table+feed_id]')
            .equals(['transit', 'trips', feedId])
            .count()

        const ids = await this.feedDb.dependency
            .where('[feed+table+feed_id]')
            .equals(['transit', 'trips', feedId])
            .offset(this.offset)
            .toArray(deps => deps.map(d => d.dependency_id))

        const trips = await this.transitDb.trips
            .where('trip_id')
            .anyOf(ids)
            .toArray()

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const trip = trips.at(this.offset - (feed.index ?? 0))
            const route = trip ? await this.transitDb.routes.get(trip.route_id) : undefined;
            await this.feedDb.transit.update(feedId, {
                progress: `stopovers ${percent} %, trip ${this.offset} / ${count}: ${route?.route_short_name} ${trip?.trip_short_name} ${trip?.trip_headsign}`,
                index: this.offset
            });
        }, 1000)

        for (const trip of trips) {
            const stopovers: Stopover[] = [];

            const stopTimes = await this.transitDb.stopTimes
                .where({trip_id: trip.trip_id})
                .toArray();

            stopTimes.sort((a, b) => {
                const timeA = a.departure_time ?? a.arrival_time
                const timeB = b.departure_time ?? b.arrival_time
                if (timeA && timeB) {
                    return parseStopTime(timeA, date).getTime() - parseStopTime(timeB, date).getTime()
                } else {
                    return 0
                }
            })

            for (const stopTime of stopTimes) {
                const stop = await this.transitDb.stops.get(stopTime.stop_id)
                const station = stop?.parent_station ? await this.scheduleDb.station.get(stop?.parent_station) : undefined

                if (stop && station) {
                    const route = await this.transitDb.routes.get(trip.route_id)
                    const service = await this.transitDb.calendar.get(trip.service_id)
                    const exceptions = await this.transitDb.calendarDates
                        .where('service_id')
                        .equals(trip.service_id)
                        .toArray()

                    if (route && service) {
                        stopovers.push(createStopover(
                            stopTime,
                            stop,
                            trip,
                            route,
                            station,
                            stopTimes,
                            service,
                            exceptions,
                            stopovers.length
                        ))
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

        this.offset = feed.index ?? 0;

        const count = await this.feedDb.dependency
            .where('[feed+table+feed_id]')
            .equals(['transit', 'stops', feedId])
            .count()

        const ids = await this.feedDb.dependency
            .where('[feed+table+feed_id]')
            .equals(['transit', 'stops', feedId])
            .offset(this.offset)
            .toArray(deps => deps.map(d => d.dependency_id))

        const stops = await this.transitDb.stops
            .where('stop_id')
            .anyOf(ids)
            .toArray()

        const interval = setInterval(async () => {
            const percent = Math.ceil((this.offset / count) * 100)
            const stop = stops.at(this.offset - (feed.index ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `stations ${percent} %, ${this.offset} / ${count}: ${stop?.stop_name}`,
                index: this.offset
            });
        }, 1000);

        for (const stop of stops) {
            const stationId = feed.is_ifopt ? encodeIFOPT(decodeIFOPT(stop.stop_id), true) : stop.stop_id;
            const station: Station = await this.scheduleDb.station.get(stationId) ?? {
                id: stationId,
                name: stop.stop_name,
                keywords: [],
                latitude: stop.stop_lat,
                longitude: stop.stop_lon,
                stopIds: [],
                locations: []
            }

            station.stopIds.push(stop.stop_id)
            const keywords = new Set(station.keywords)
            for (const keyword of lunr.tokenizer(stop.stop_name).map(String)) {
                keywords.add(keyword)
            }
            station.keywords = Array.from(keywords)
            station.locations.push({
                latitude: stop.stop_lat,
                longitude: stop.stop_lon,
            })

            await this.scheduleDb.station.put(station)
            await this.transitDb.stops.update(stop, {
                parent_station: stationId
            })
            this.offset++;
        }
        clearInterval(interval)
    }
}
