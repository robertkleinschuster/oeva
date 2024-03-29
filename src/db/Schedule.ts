import {Calendar, CalendarDate} from "./GTFS.ts";

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

export interface Stopover {
    station_id: string;
    stop_id: string;
    trip_id: string;
    route_id: string;
    service_id: string;
    route_type: RouteType;
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
    service: Calendar,
    exceptions: Map<string, CalendarDate>
}

export interface Station {
    id: string;
    name: string;
    keywords: string[];
    stopIds: string[];
    latitude: number;
    longitude: number;
    locations: {
        latitude: number;
        longitude: number;
    }[],
}