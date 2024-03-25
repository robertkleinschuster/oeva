import {Calendar, CalendarDate} from "./Transit.ts";

export interface Stopover {
    station_id: string;
    stop_id: string;
    trip_id: string;
    route_id: string;
    service_id: string;
    sequence: number;
    departure_time: string|undefined;
    arrival_time: string|undefined;
    line: string;
    direction: string | undefined;
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