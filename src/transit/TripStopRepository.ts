import {isTripStopActiveOn} from "./Schedule";
import {scheduleDB} from "../db/ScheduleDB";
import {RouteType, TripStop} from "../db/Schedule";
import {gridDisk, H3IndexInput} from "h3-js";
import {H3Cell} from "./H3Cell";

export interface FilterState {
    ringSize: number,
    date: Date,
    arrivals: boolean,
    rail: boolean,
    subway: boolean,
    trams: boolean,
    busses: boolean,
    other: boolean,
}


export class TripStopRepository {
    async findByTrip(tripId: string): Promise<TripStop[]> {
        return scheduleDB.trip_stop
            .where('trip_id')
            .equals(tripId)
            .sortBy('sequence_in_trip')
    }

    async findByStop(stopId: string, filterState: FilterState): Promise<TripStop[]> {
        const stop = await scheduleDB.stop.get(stopId)
        if (!stop) {
            throw new Error('Stop not found')
        }
        return this.findByCell([stop.h3_cell_le1, stop.h3_cell_le2], filterState);
    }

    async findByCell(cell: H3IndexInput, filterState: FilterState): Promise<TripStop[]> {
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
        const filters = cells.map(cell => {
            cellObj.fromIndex(cell)
            return [...cellObj.toIndexInput(), hours]
        });

        const tripStops = new Map<string, TripStop>
        for (const filter of filters) {
            await scheduleDB.trip_stop
                .where('[h3_cell_le1+h3_cell_le2+hour]')
                .equals(filter)
                .each(tripStop => {
                    if ((filterState.arrivals || !tripStop.is_destination) && routeTypes.includes(tripStop.route_type) && isTripStopActiveOn(tripStop, filterState.date)) {
                        tripStops.set(tripStop.id, tripStop)
                    }
                })
        }

        return Array.from(tripStops.values())
            .sort((a, b) => a.sequence_at_stop - b.sequence_at_stop);
    }

    async findConnections(tripStop: TripStop, filterState: FilterState) {
        return await this.findByCell([tripStop.h3_cell_le1, tripStop.h3_cell_le2], filterState)
            .then(connections => connections.filter(connection => connection.trip_id !== tripStop.trip_id));
    }
}


