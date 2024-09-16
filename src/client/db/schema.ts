import {Boarding, RouteType} from "./Schedule";
import {Generated, Selectable} from "kysely";
import {ExceptionType} from "./GTFS";

export interface Service {
    service_id: string;
    feed_id: number;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    start_date: number;
    end_date: number;
}

export interface Exception {
    exception_id: Generated<number>
    service_id: string
    date: number
    type: ExceptionType
}

export interface Stop {
    stop_id: string;
    feed_name: string;
    feed_parent_station?: string;
    stop_name: string;
    platform?: string;
    h3_cell_le1: number;
    h3_cell_le2: number;
    keywords: string;
    last_used?: number;
    favorite_order?: number;
}


export interface Trip {
    trip_id: string;
    service_id: string;
    feed_name: string;
    feed_trip_id: string;
    trip_name: string;
    line?: string;
    number?: string;
    category?: string;
    direction: string;
    route_type: RouteType;
    keywords: string;
}

export interface TripStop {
    trip_stop_id: string;
    stop_id: string;
    trip_id: string;
    hour: number;
    sequence_in_trip: number;
    sequence_at_stop: number;
    departure_time?: number;
    arrival_time?: number;
    boarding: Boarding;
    is_origin: boolean;
    is_destination: boolean;
}


export interface Database {
    service: Service
    exception: Exception
    stop: Stop
    trip: Trip
    trip_stop: TripStop
}

export type FullTripStop = Selectable<TripStop> & Selectable<Stop> & Selectable<Trip>