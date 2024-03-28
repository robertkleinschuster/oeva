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

        const stopIds = await this.feedDb.dependency.where({
            feed: 'transit',
            table: 'stops',
            feed_id: feedId
        }).toArray(
            dependencies => dependencies.map(dependency => dependency.dependency_id)
        )
        let index = feed.index ?? 0;

        const date = new Date()
        const stations = await this.scheduleDb.station
            .where('stopIds')
            .anyOf(stopIds)
            .offset(index)
            .toArray()

        const stationCount = await this.scheduleDb.station
            .where('stopIds')
            .anyOf(stopIds)
            .count()

        const interval = setInterval(async () => {
            const percent = Math.ceil((index / stationCount) * 100)
            const station = stations.at(index - (feed.index ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `stopovers ${percent} % (station ${index} / ${stationCount}: ${station?.name})`,
                index: index
            });
        }, 2000)

        let stopovers: Stopover[] = [];
        for (const station of stations) {
            const stopTimes = await this.transitDb.stopTimes
                .where('stop_id')
                .anyOf(station.stopIds)
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
                const trip = await this.transitDb.trips.get(stopTime.trip_id)
                const stop = await this.transitDb.stops.get(stopTime.stop_id)
                const station = stop?.parent_station ? await this.scheduleDb.station.get(stop?.parent_station) : undefined

                if (trip && stop && station) {
                    const route = await this.transitDb.routes.get(trip.route_id)
                    const tripStopTimes = await this.transitDb.stopTimes
                        .where({trip_id: trip.trip_id})
                        .toArray()

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
                            tripStopTimes,
                            service,
                            exceptions,
                            stopovers.length
                        ))
                    }
                }
            }

            if (stopovers.length > 5000) {
                await this.scheduleDb.stopover.bulkPut(stopovers);
                stopovers = []
            }
            index++
        }
        await this.scheduleDb.stopover.bulkPut(stopovers);
        clearInterval(interval)
    }

     async processStops(feedId: number) {
        const feed = await this.feedDb.transit.get(feedId);
        if (!feed) {
            throw new Error('Feed not found')
        }

        const stopIds = await this.feedDb.dependency.where({
            feed: 'transit',
            table: 'stops',
            feed_id: feedId
        }).toArray(stops => stops.map(stop => stop.dependency_id))

        let index = feed.index ?? 0;

        const stops = await this.transitDb.stops
            .where('stop_id')
            .anyOf(stopIds)
            .offset(index)
            .toArray()

        const stopCount = await this.transitDb.stops
            .where('stop_id')
            .anyOf(stopIds)
            .count()

        const interval = setInterval(async () => {
            const percent = Math.ceil((index / stopCount) * 100)
            const stop = stops.at(index - (feed.index ?? 0))
            await this.feedDb.transit.update(feedId, {
                progress: `stations ${percent} % (${index} / ${stopCount}: ${stop?.stop_name})`,
                index: index
            });
        }, 2000);

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
