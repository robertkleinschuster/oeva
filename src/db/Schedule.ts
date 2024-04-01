import {GTFSCalendar, GTFSCalendarDate} from "./GTFS";

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

export const H3_RESOLUTION = 14;

export interface Stopover {
    id: string;
    station_id: string;
    trip_id: string;
    h3_cell: string;
    route_type: RouteType;
    boarding: Boarding;
    sequence_in_trip: number;
    minutes: number | undefined;
    time: string | undefined;
    departure_time: string | undefined;
    arrival_time: string | undefined;
    line: string;
    direction: string | undefined;
    stop: string;
    station: string;
    is_origin: boolean;
    is_destination: boolean;
}

export interface Station {
    id: string;
    feed_id: number;
    feed_station_id: string;
    name: string;
    stop_names: Map<string, string>;
    keywords: string[];
    h3_cells: string[];
}

export interface Trip {
    id: string;
    feed_id: number;
    feed_trip_id: string;
    h3_cells: string[];
    name: string;
    direction: string;
    route_type: RouteType
    service: GTFSCalendar;
    exceptions: Map<string, GTFSCalendarDate>;
    keywords: string[];
}