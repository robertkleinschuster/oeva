import {Database, FullTripStop, Stop} from "./db/schema";
import {RouteType, WeekdayCode} from "./db/enums";
import {gridDisk, H3IndexInput} from "h3-js";
import {formatServiceDate} from "./DateTime";
import {ExceptionType} from "./gtfs-types";
import {weekdayCodes} from "./Schedule";
import {Kysely} from "kysely";
import {transliterate} from "transliteration";
import Tokenizer from "wink-tokenizer";
import Fuse from "fuse.js";

export interface FilterState {
    ringSize: number,
    date: Date,
    arrivals: boolean,
    rail: boolean,
    subway: boolean,
    trams: boolean,
    busses: boolean,
    trolleybusses: boolean,
    other: boolean,
}


export class Repo {
    constructor(private db: Kysely<Database>) {
    }

    async searchStop(keyword: string, limit = 10): Promise<Stop[]> {
        const transliteratedKeyword = transliterate(keyword);
        const tokenizer = new Tokenizer()
        const tokens = tokenizer.tokenize(transliteratedKeyword).map(token => token.value.toLowerCase())

        const stops = new Map<string, Stop>()
        await this.findStations(transliteratedKeyword, stop => stops.set(stop.stop_id, stop), limit)

        if (stops.size === 0) {
            for (const token of tokens) {
                await this.findStations(token, stop => stops.set(stop.stop_id, stop), limit)
            }
        }

        if (stops.size === 0) {
            await this.findStops(transliteratedKeyword, stop => stops.set(stop.stop_id, stop), limit)
        }

        if (stops.size === 0) {
            for (const token of tokens) {
                await this.findStops(token, stop => stops.set(stop.stop_id, stop), limit)
            }
        }

        const fuse = new Fuse(
            Array.from(stops.values()),
            {
                keys: ['name', 'keywords'],
                threshold: 0.4,
                useExtendedSearch: true,
            }
        )

        const result = fuse.search(transliteratedKeyword).map(result => result.item)
        if (result.length === 0 && limit !== 1000) {
            return this.searchStop(keyword, 1000)
        }

        return result;
    }

    async findStops(keyword: string, each: (stop: Stop) => void, limit: number) {
        (await this.db
            .selectFrom('stop')
            .selectAll()
            .where('keywords', 'like', `%${keyword}%`)
            .limit(limit)
            .execute()).forEach(each)
    }

    async findStations(keyword: string, each: (stop: Stop) => void, limit: number) {
        (await this.db
            .selectFrom('stop')
            .selectAll()
            .where('keywords', 'like', `%${keyword}%`)
            .where('feed_parent_station', 'is', null)
            .limit(limit)
            .execute()).forEach(each)
    }

    async findByTrip(tripId: string): Promise<FullTripStop[]> {
        return await this.db.selectFrom('trip_stop')
            .innerJoin('stop', 'trip_stop.stop_id', 'stop.stop_id')
            .innerJoin('trip', 'trip_stop.trip_id', 'trip.trip_id')
            .selectAll()
            .where('trip.trip_id', '=', tripId)
            .orderBy('sequence_in_trip')
            .execute()
    }

    async findByStop(stopId: string, filterState: FilterState): Promise<FullTripStop[]> {
        const stop = await this.db.selectFrom('stop')
            .select(['h3_cell'])
            .where('stop.stop_id', '=', stopId)
            .executeTakeFirstOrThrow()
        return this.findByCell(stop.h3_cell, filterState);
    }

    async findByCell(cell: H3IndexInput, filterState: FilterState): Promise<FullTripStop[]> {
        const routeTypes: RouteType[] = [];
        if (filterState.rail) {
            routeTypes.push(RouteType.RAIL)
        }
        if (filterState.subway) {
            routeTypes.push(RouteType.SUBWAY)
        }
        if (filterState.trams) {
            routeTypes.push(RouteType.TRAM)
            routeTypes.push(RouteType.CABLE_TRAM)
        }
        if (filterState.busses) {
            routeTypes.push(RouteType.BUS)
        }
        if (filterState.trolleybusses) {
            routeTypes.push(RouteType.TROLLEYBUS)
        }
        if (filterState.other) {
            routeTypes.push(RouteType.AERIAL_LIFT)
            routeTypes.push(RouteType.FERRY)
            routeTypes.push(RouteType.FUNICULAR)
            routeTypes.push(RouteType.MONORAIL)
        }

        const cells = gridDisk(cell, filterState.ringSize);

        const dateAsInt = formatServiceDate(filterState.date);
        const weekday = filterState.date.getUTCDay();
        const time = filterState.date.getHours() * 100 + filterState.date.getMinutes()

        const query = this.db.selectFrom('trip_stop')
            .innerJoin('stop', 'trip_stop.stop_id', 'stop.stop_id')
            .innerJoin('trip', 'trip_stop.trip_id', 'trip.trip_id')
            .innerJoin('service', 'trip.service_id', 'service.service_id')
            .leftJoin('exception', join => join
                .onRef('service.service_id', '=', 'exception.service_id')
                .on('exception.date', '=', dateAsInt)
            )
            .selectAll('trip_stop')
            .selectAll('stop')
            .selectAll('trip')
            .where('h3_cell', 'in', cells)
            .where(eb =>
                eb.or([
                    eb('departure_time', '>=', time),
                    eb('arrival_time', '>=', time),
                ])
            ).where(eb =>
                eb.or([
                    eb('departure_time', '<=', time + 100),
                    eb('arrival_time', '<=', time + 100),
                ])
            )
            .where(weekdayCodes.get(weekday) as WeekdayCode, '=', true)
            .where('start_date', '<=', dateAsInt)
            .where('end_date', '>=', dateAsInt)
            .where('is_destination', 'in', filterState.arrivals ? [true, false] : [false])
            .where('route_type', 'in', routeTypes)
            .where('exception.type', 'is not', ExceptionType.NOT_RUNNING)
            .orderBy('sequence_at_stop')

        return await query.execute()
    }

    async findConnections(tripStop: FullTripStop, filterState: FilterState) {
        return await this.findByCell(tripStop.h3_cell, filterState)
            .then(connections => connections.filter(connection => connection.trip_id !== tripStop.trip_id));
    }
}


