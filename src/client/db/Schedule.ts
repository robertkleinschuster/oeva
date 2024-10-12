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
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
}

export type WeekdayCode = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'

export interface TripStop {
    id: string;
    stop_id: string;
    trip_id: string;
    feed_id: number;
    h3_cell_le1: number; // little endian first part
    h3_cell_le2: number; // little endian second part
    hour: number | undefined;
    sequence_in_trip: number;
    sequence_at_stop: number;
    route_type: RouteType;
    departure_time: number | undefined;
    arrival_time: number | undefined;
    boarding: Boarding;
    is_origin: boolean;
    is_destination: boolean;
    service_start_date: number | undefined;
    service_end_date: number | undefined;
    service_weekdays: number;
    service_exceptions: Map<number, ExceptionType>;
    trip?: Trip;
    stop?: Stop;
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
    last_used?: number;
    favorite_order?: number;
}

export interface Trip {
    id: string;
    feed_id: number;
    feed_name: string;
    feed_trip_id: string;
    name: string;
    line?: string;
    number?: string;
    category?: string;
    direction: string;
    origin?: string;
    origin_stop_id?: string;
    destination?: string;
    destination_stop_id?: string;
    route_type: RouteType
    service_start_date: number | undefined;
    service_end_date: number | undefined;
    service_weekdays: number;
    service_exceptions: Map<number, ExceptionType>;
    keywords: string[];
}