import {decodeIFOPT, encodeIFOPT} from "../transit/IFOPT.ts";
import {Station, Stopover} from "../db/Schedule.ts";
import {scheduleDB} from "../db/ScheduleDB.ts";
import lunr from "lunr";
import {feedDb} from "../db/FeedDb.ts";
import {transitDB} from "../db/TransitDB.ts";
import {parseStopTime} from "../transit/DateTime.ts";
import {createStopover} from "./StopoverFactory.ts";
import {TransitFeedStep} from "../db/Feed.ts";

self.onmessage = async (e: MessageEvent<number>) => {
    const feedId = e.data;
    const feed = await feedDb.transit.get(feedId);
    if (!feed) {
        throw new Error('Feed not found')
    }
    if (feed.step === undefined || feed.step === TransitFeedStep.STATIONS) {
        await feedDb.transit.update(feedId, {
            step: TransitFeedStep.STATIONS,
            index: feed.step === undefined ? 0 : feed.index
        });
        await processStops(feedId)
    }
    if (feed.step === undefined || feed.step === TransitFeedStep.STOPOVERS) {
        await feedDb.transit.update(feedId, {
            step: TransitFeedStep.STOPOVERS,
            index: feed.step === undefined ? 0 : feed.index
        });
        await processStopTimes(feedId)
    }
    self.postMessage('done')
};

export async function processStopTimes(feedId: number) {
    const feed = await feedDb.transit.get(feedId);
    if (!feed) {
        throw new Error('Feed not found')
    }

    const stopIds = await feedDb.dependency.where({
        feed: 'transit',
        table: 'stops',
        feed_id: feedId
    }).toArray(
        dependencies => dependencies.map(dependency => dependency.dependency_id)
    )
    let index = feed.index ?? 0;

    const date = new Date()
    const stations = await scheduleDB.station
        .where('stopIds')
        .anyOf(stopIds)
        .offset(index)
        .toArray()

    const stationCount = await scheduleDB.station
        .where('stopIds')
        .anyOf(stopIds)
        .count()

    const interval = setInterval(async () => {
        const percent = Math.ceil((index / stationCount) * 100)
        const station = stations.at(index)
        await feedDb.transit.update(feedId, {
            progress: `stopovers ${percent} % (station ${index} / ${stationCount}: ${station?.name})`,
            index: index
        });
    }, 2000)

    let stopovers: Stopover[] = [];
    for (const station of stations) {
        const stopTimes = await transitDB.stopTimes
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
            const trip = await transitDB.trips.get(stopTime.trip_id)
            const stop = await transitDB.stops.get(stopTime.stop_id)
            const station = stop?.parent_station ? await scheduleDB.station.get(stop?.parent_station) : undefined

            if (trip && stop && station) {
                const route = await transitDB.routes.get(trip.route_id)
                const tripStopTimes = await transitDB.stopTimes
                    .where({trip_id: trip.trip_id})
                    .toArray()

                const service = await transitDB.calendar.get(trip.service_id)
                const exceptions = await transitDB.calendarDates
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
            await scheduleDB.stopover.bulkPut(stopovers);
            stopovers = []
        }
        index++
    }
    await scheduleDB.stopover.bulkPut(stopovers);
    clearInterval(interval)
}

export async function processStops(feedId: number) {
    const feed = await feedDb.transit.get(feedId);
    if (!feed) {
        throw new Error('Feed not found')
    }

    const stopIds = await feedDb.dependency.where({
        feed: 'transit',
        table: 'stops',
        feed_id: feedId
    }).toArray(stops => stops.map(stop => stop.dependency_id))

    let index = feed.index ?? 0;

    const stops = await transitDB.stops
        .where('stop_id')
        .anyOf(stopIds)
        .offset(index)
        .toArray()

    const stopCount = await transitDB.stops
        .where('stop_id')
        .anyOf(stopIds)
        .count()

    const interval = setInterval(async () => {
        const percent = Math.ceil((index / stopCount) * 100)
        const stop = stops.at(index)
        await feedDb.transit.update(feedId, {
            progress: `stations ${percent} % (${index} / ${stopCount}: ${stop?.stop_name})`,
            index: index
        });
    }, 2000);

    for (const stop of stops) {
        const stationId = feed.is_ifopt ? encodeIFOPT(decodeIFOPT(stop.stop_id), true) : stop.stop_id;
        const station: Station = await scheduleDB.station.get(stationId) ?? {
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

        await scheduleDB.station.put(station)
        await transitDB.stops.update(stop, {
            parent_station: stationId
        })
        index++;
    }
    clearInterval(interval)
}