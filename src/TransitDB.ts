import Dexie from 'dexie';

interface Agency {
    agency_id: string;
    agency_name: string;
    agency_url: string;
    agency_timezone: string;
    agency_lang?: string;
    agency_phone?: string;
    agency_fare_url?: string;
    agency_email?: string;
    feed_id: number;
}

export interface Stop {
    stop_id: string;
    stop_code?: string;
    stop_name: string;
    stop_desc?: string;
    stop_lat: number;
    stop_lon: number;
    zone_id?: string;
    stop_url?: string;
    location_type?: number;
    parent_station?: string;
    stop_timezone?: string;
    wheelchair_boarding?: number;
    level_id?: string;
    platform_code?: string;
    feed_id: number;
}

export interface Route {
    route_id: string;
    agency_id?: string;
    route_short_name: string;
    route_long_name: string;
    route_desc?: string;
    route_type: number;
    route_url?: string;
    route_color?: string;
    route_text_color?: string;
    route_sort_order?: number;
    continuous_pickup?: number;
    continuous_drop_off?: number;
    feed_id: number;
}

export interface Trip {
    route_id: string;
    service_id: string;
    trip_id: string;
    trip_headsign?: string;
    trip_short_name?: string;
    direction_id?: number;
    block_id?: string;
    shape_id?: string;
    wheelchair_accessible?: number;
    bikes_allowed?: number;
    feed_id: number;
}

export interface StopTime {
    trip_id: string;
    arrival_time?: string;
    departure_time?: string;
    stop_id: string;
    stop_sequence: number;
    stop_headsign?: string;
    pickup_type?: number;
    drop_off_type?: number;
    continuous_pickup?: number;
    continuous_drop_off?: number;
    shape_dist_traveled?: number;
    timepoint?: number;
    feed_id: number;
}

interface Calendar {
    service_id: string;
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
    start_date: string;
    end_date: string;
    feed_id: number;
}

interface CalendarDate {
    service_id: string;
    date: string;
    exception_type: number;
    feed_id: number;
}

interface Shape {
    shape_id: string;
    shape_pt_lat: number;
    shape_pt_lon: number;
    shape_pt_sequence: number;
    shape_dist_traveled?: number;
    feed_id: number;
}

interface Frequency {
    trip_id: string;
    start_time: string;
    end_time: string;
    headway_secs: number;
    exact_times?: number;
    feed_id: number;
}

interface Transfer {
    from_stop_id: string;
    to_stop_id: string;
    transfer_type: number;
    min_transfer_time?: number;
    feed_id: number;
}

interface Level {
    level_id: string;
    level_index: string;
    level_name: string;
    feed_id: number;
}

interface Pathway {
    pathway_id: string;
    from_stop_id: string;
    to_stop_id: string;
    pathway_mode: number;
    is_bidirectional: boolean;
    traversal_time: number;
    feed_id: number;
}

export class TransitDB extends Dexie {
    public agencies: Dexie.Table<Agency, string>;
    public stops: Dexie.Table<Stop, string>;
    public routes: Dexie.Table<Route, string>;
    public trips: Dexie.Table<Trip, string>;
    public stopTimes: Dexie.Table<StopTime, number>;
    public calendar: Dexie.Table<Calendar, string>;
    public calendarDates: Dexie.Table<CalendarDate, number>;
    public shapes: Dexie.Table<Shape, number>;
    public frequencies: Dexie.Table<Frequency, number>;
    public transfers: Dexie.Table<Transfer, number>;
    public levels: Dexie.Table<Level, number>;
    public pathways: Dexie.Table<Pathway, number>;

    public constructor() {
        super('Transit');
        this.version(1).stores({
            agencies: 'agency_id,feed_id',
            stops: 'stop_id,stop_name,parent_station,[stop_lat+stop_lon],feed_id',
            routes: 'route_id,route_type,feed_id',
            trips: 'trip_id,route_id,shape_id,direction_id,feed_id',
            stopTimes: '[trip_id+stop_id],trip_id,stop_id,feed_id',
            calendar: 'service_id,[service_id+start_date+end_date],feed_id',
            calendarDates: '[service_id+date],service_id,feed_id',
            shapes: 'shape_id,feed_id',
            frequencies: '[trip_id+start_time],feed_id',
            transfers: '[from_stop_id+to_stop_id],feed_id',
            levels: 'level_id,level_index,level_name,feed_id',
            pathways: 'pathway_id,[from_stop_id+to_stop_id+is_bidirectional],feed_id',
        });

        this.agencies = this.table('agencies');
        this.stops = this.table('stops');
        this.routes = this.table('routes');
        this.trips = this.table('trips');
        this.stopTimes = this.table('stopTimes');
        this.calendar = this.table('calendar');
        this.calendarDates = this.table('calendarDates');
        this.shapes = this.table('shapes');
        this.frequencies = this.table('frequencies');
        this.transfers = this.table('transfers');
        this.levels = this.table('levels');
        this.pathways = this.table('pathways');
    }
}

export const transitDB = new TransitDB();
