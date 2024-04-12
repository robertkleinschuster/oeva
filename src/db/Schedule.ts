import {ExceptionType} from "./GTFS";

export const H3_RESOLUTION = 12;

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

export const routeTypeNames = new Map<RouteType, string>([
    [RouteType.RAIL, 'Zug'],
    [RouteType.SUBWAY, 'U-Bahn'],
    [RouteType.TRAM, 'Tram'],
    [RouteType.CABLE_TRAM, 'Straßenseilbahn'],
    [RouteType.BUS, 'Bus'],
    [RouteType.TROLLEYBUS, 'O-Bus'],
    [RouteType.FUNICULAR, 'Standseilbahn'],
    [RouteType.MONORAIL, 'Einschienenbahn'],
    [RouteType.FERRY, 'Fähre'],
    [RouteType.AERIAL_LIFT, 'Luftseilbahn'],
])

export enum Boarding {
    NONE,
    STANDARD,
    ONLY_DISEMBARKING,
    ONLY_BOARDING,
    ON_REQUEST,
    ON_CALL,
}
export enum Weekday {
    Sunday = 1,
    Saturday = 2,
    Friday = 4,
    Thursday = 8,
    Wednesday = 16,
    Tuesday = 32,
    Monday = 64,
}

export interface TripStop {
    id: string;
    stop_id: string;
    trip_id: string;
    feed_id: number;
    feed_name: string;
    h3_cell_le1: number; // little endian first part
    h3_cell_le2: number; // little endian second part
    route_type: RouteType;
    boarding: Boarding;
    sequence_in_trip: number;
    sequence_at_stop: number;
    hour: number | undefined;
    departure_time: number | undefined;
    arrival_time: number | undefined;
    trip_name: string;
    direction: string | undefined;
    stop_name: string;
    stop_platform: string | undefined;
    is_origin: boolean;
    is_destination: boolean;
    service_start_date: number | undefined;
    service_end_date: number | undefined;
    service_weekdays: number;
    service_exceptions: Map<number, ExceptionType>;
}

export interface Stop {
    id: string;
    feed_id: number;
    feed_name: string;
    feed_stop_id: string;
    feed_parent_station?: string;
    name: string;
    platform?: string;
    h3_cell_le1: number; // little endian first part
    h3_cell_le2: number; // little endian second part
    keywords: string[];
}

export interface Trip {
    id: string;
    feed_id: number;
    feed_name: string;
    feed_trip_id: string;
    name: string;
    direction: string;
    route_type: RouteType
    service_start_date: number | undefined;
    service_end_date: number | undefined;
    service_weekdays: number;
    service_exceptions: Map<number, ExceptionType>;
    keywords: string[];
}