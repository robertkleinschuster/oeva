import {FullTripStop} from "../db/schema";
import {RouteType} from "../db/Schedule";
import {gridDisk, H3IndexInput} from "h3-js";
import {H3Cell} from "./H3Cell";
import {db} from "../db/client";
import {formatServiceDate} from "./DateTime";
import {ExceptionType} from "../db/GTFS";

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
            .select(['h3_cell_le1', 'h3_cell_le2'])
            .where('stop.stop_id', '=', stopId)
            .executeTakeFirstOrThrow()
        return this.findByCell([stop.h3_cell_le1, stop.h3_cell_le2], filterState);
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

        const hours = filterState.date.getHours();
        const cells = gridDisk(cell, filterState.ringSize);
        const cellObj = new H3Cell()
        const cells_1: number[] = [];
        const cells_2: number[] = []

        for (const cell of cells) {
            cellObj.fromIndex(cell)
            const index = cellObj.toIndexInput()
            cells_1.push(index[0])
            cells_2.push(index[1])
        }

        const dateAsInt = formatServiceDate(filterState.date);
        const query = db.selectFrom('trip_stop')
            .innerJoin('stop', 'trip_stop.stop_id', 'stop.stop_id')
            .innerJoin('trip', 'trip_stop.trip_id', 'trip.trip_id')
            .innerJoin('service', 'trip.service_id', 'service.service_id')
            .leftJoin('exception', 'service.service_id', 'exception.service_id')
            .selectAll('trip_stop')
            .selectAll('stop')
            .selectAll('trip')
            .where('h3_cell_le1', 'in', cells_1)
            .where('h3_cell_le2', 'in', cells_2)
            .where('hour', '=', hours)
            .where('start_date', '<=', dateAsInt)
            .where('end_date', '>=', dateAsInt)
            .where('is_destination', '=', false)
            .where('route_type', 'in', routeTypes)
            .where(eb => eb.or([
                eb('exception.type', '=', ExceptionType.RUNNING),
                eb('exception.type', 'is', null),
            ]))
            .where(eb => eb.or([
                eb('exception.date', '=', dateAsInt),
                eb('exception.date', 'is', null),
            ]))
            .orderBy('sequence_in_trip')
        return await query.execute()
    }

    async findConnections(tripStop: FullTripStop, filterState: FilterState) {
        return await this.findByCell([tripStop.h3_cell_le1, tripStop.h3_cell_le2], filterState)
            .then(connections => connections.filter(connection => connection.trip_id !== tripStop.trip_id));
    }
}


