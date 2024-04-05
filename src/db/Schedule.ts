import {ExceptionType, GTFSCalendar, GTFSCalendarDate} from "./GTFS";

export enum RouteType {
    TRAM = 0,
    SUBWAY = 1,
    RAIL = 2,
    BUS = 3,
    FERRY = 4,
    CABLE_TRAM = 5,
    AERIAL_LIFT = 6,
    FUNICULAR = 7,
    TROLLEYBUS = 11,
    MONORAIL = 12
}

export enum Boarding {
    NONE,
    STANDARD,
    ONLY_DISEMBARKING,
    ONLY_BOARDING,
    ON_REQUEST,
    ON_CALL,
}

export const H3_RESOLUTION = 12;

export interface TripStop {
    id: string;
    stop_id: string;
    trip_id: string;
    h3_cell: string;
    route_type: RouteType;
    boarding: Boarding;
    sequence_in_trip: number;
    minutes: number | undefined;
    time: string | undefined;
    departure_time: string | undefined;
    arrival_time: string | undefined;
    trip_name: string;
    direction: string | undefined;
    stop_name: string;
    is_origin: boolean;
    is_destination: boolean;
}

export interface Stop {
    id: string;
    feed_id: number;
    feed_stop_id: string;
    name: string;
    platform?: string;
    h3_cell: string;
    keywords: string[];
}

export interface Trip {
    id: string;
    feed_id: number;
    feed_trip_id: string;
    name: string;
    direction: string;
    route_type: RouteType
    service: GTFSCalendar;
    exceptions: Map<string, ExceptionType>;
    keywords: string[];
}