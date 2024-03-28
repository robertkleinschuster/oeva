import {decodeIFOPT, encodeIFOPT} from "../transit/IFOPT.ts";
import {Station, Stopover} from "../db/Schedule.ts";
import {ScheduleDB} from "../db/ScheduleDB.ts";
import lunr from "lunr";
import {FeedDB} from "../db/FeedDb.ts";
import {TransitDB} from "../db/TransitDB.ts";
import {parseStopTime} from "../transit/DateTime.ts";
import {createStopover} from "./StopoverFactory.ts";

export class FeedProcessor {
    constructor(private feedDb: FeedDB, private transitDb: TransitDB, private scheduleDb: ScheduleDB) {
    }

    async processStopTimes(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found')
        }

        let offset = feed.index ?? 0;

        const ids = await this.feedDb.dependency
            .where('[feed+table+feed_id]')
            .equals(['transit', 'trips', feedId])
            .toArray(deps => deps.map(d => d.dependency_id))

        if (!ids.length) {
            return;
        }

        const date = new Date()

        const count = await this.transitDb.trips
            .where('trip_id')
            .anyOf(ids)
            .count()

        const trips = await this.transitDb.trips
            .where('trip_id')
            .anyOf(ids)
            .offset(offset)
            .toArray()

        const interval = setInterval(async () => {
            const percent = Math.ceil((offset / count) * 100)
            const trip = trips.at(offset - (feed.index ?? 0))
            const route = trip ? await this.transitDb.routes.get(trip.route_id) : undefined;
            await this.feedDb.transit.update(feedId, {
                progress: `stopovers ${percent} %, trip ${offset} / ${count}: ${route?.route_short_name} ${trip?.trip_short_name} ${trip?.trip_headsign}`,
                index: offset
            });
        }, 1000)

        let index = 0;
        let stopovers: Stopover[] = [];
        for (const trip of trips) {
            const stopTimes = await this.transitDb.stopTimes
                .where({trip_id: trip.trip_id})
                .sortBy('stop_sequence')
                .then(stopTimes => stopTimes.sort((a, b) => {
                        const timeA = a.departure_time ?? a.arrival_time;
                        const timeB = b.departure_time ?? b.arrival_time;
                        if (!timeA || !timeB) {
                            return 0;
                        }

                        return parseStopTime(timeA, date).getTime() - parseStopTime(timeB, date).getTime()
                    })
                );

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

            if (stopovers.length > 500) {
                await this.scheduleDb.stopover.bulkPut(stopovers);
                offset += index
                stopovers = []
            }
            index++;
        }

        clearInterval(interval)

        if (stopovers.length) {
            await this.scheduleDb.stopover.bulkPut(stopovers);
        }
    }

    async processStops(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found')
        }

        const stopCount = await this.feedDb.dependency
            .where('[feed+table+feed_id]')
            .equals(['transit', 'stops', feedId])
            .count()

        let index = feed.index ?? 0;

        const stopIds = await this.feedDb.dependency
            .where('[feed+table+feed_id]')
            .equals(['transit', 'stops', feedId])
            .offset(index)
            .toArray(deps => deps.map(d => d.dependency_id))

        if (!stopIds.length) {
            return;
        }

        const stops = await this.transitDb.stops
            .where('stop_id')
            .anyOf(stopIds)
            .toArray()

        const interval = setInterval(async () => {
            const percent = Math.ceil((index / stopCount) * 100)
            const stop = stops.at(index - (feed.index ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `stations ${percent} %, ${index} / ${stopCount}: ${stop?.stop_name}`,
                index: index
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
            index++;
        }
        clearInterval(interval)
    }
}
