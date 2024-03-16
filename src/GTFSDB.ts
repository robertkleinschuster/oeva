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
}

interface CalendarDate {
    service_id: string;
    date: string;
    exception_type: number;
}

interface Shape {
    shape_id: string;
    shape_pt_lat: number;
    shape_pt_lon: number;
    shape_pt_sequence: number;
    shape_dist_traveled?: number;
}

interface Frequency {
    trip_id: string;
    start_time: string;
    end_time: string;
    headway_secs: number;
    exact_times?: number;
}

interface Transfer {
    from_stop_id: string;
    to_stop_id: string;
    transfer_type: number;
    min_transfer_time?: number;
}

interface Level {
    level_id: string;
    level_index: string;
    level_name: string;
}

interface Pathway {
    pathway_id: string;
    from_stop_id: string;
    to_stop_id: string;
    pathway_mode: number;
    is_bidirectional: boolean;
    traversal_time: number;
}

export interface Import {
    id?: number;
    url: string;
    name: string;
    files: Map<string, Blob> | null;
    imported: string[] | null;
    done: number;
    timestamp: number;
}

class GTFSDB extends Dexie {
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
    public import: Dexie.Table<Import, number>

    public constructor() {
        super('GTFSDB');
        this.version(1).stores({
            agencies: 'agency_id',
            stops: 'stop_id,stop_name,parent_station,[stop_lat+stop_lon]',
            routes: 'route_id,route_type',
            trips: 'trip_id,route_id,shape_id,direction_id',
            stopTimes: '[trip_id+stop_id],trip_id,stop_id',
            calendar: 'service_id,[service_id+start_date+end_date]',
            calendarDates: '[service_id+date],service_id',
            shapes: 'shape_id',
            frequencies: '[trip_id+start_time]',
            transfers: '[from_stop_id+to_stop_id]',
            levels: 'level_id,level_index,level_name',
            pathways: 'pathway_id,[from_stop_id+to_stop_id+is_bidirectional]',
            import: '++id,[name+done]'
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
        this.import = this.table('import')
    }
}

export const db = new GTFSDB();
