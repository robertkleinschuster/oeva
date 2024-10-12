import {FullTripStop} from "../db/schema";
import {RouteType, WeekdayCode} from "../db/Schedule";
import {gridDisk, H3IndexInput} from "h3-js";
import {db} from "../db/client";
import {formatServiceDate} from "./DateTime";
import {ExceptionType} from "../db/GTFS";
import {weekdayCodes} from "./Schedule";

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


export class TripStopRepository {
    async findByTrip(tripId: string): Promise<FullTripStop[]> {
        return await db.selectFrom('trip_stop')
            .innerJoin('stop', 'trip_stop.stop_id', 'stop.stop_id')
            .innerJoin('trip', 'trip_stop.trip_id', 'trip.trip_id')
            .selectAll()
            .where('trip.trip_id', '=', tripId)
            .orderBy('sequence_in_trip')
            .execute()
    }

    async findByStop(stopId: string, filterState: FilterState): Promise<FullTripStop[]> {
        const stop = await db.selectFrom('stop')
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

        const query = db.selectFrom('trip_stop')
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


