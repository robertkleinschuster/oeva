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

export interface Stops {
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

export interface Routes {
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

export interface Trips {
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

export interface StopTimes {
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

interface CalendarDates {
    service_id: string;
    date: string;
    exception_type: number;
}

interface FareAttributes {
    fare_id: string;
    price: string;
    currency_type: string;
    payment_method: number;
    transfers: number;
    agency_id?: string;
    transfer_duration?: number;
}

interface FareRules {
    fare_id: string;
    route_id?: string;
    origin_id?: string;
    destination_id?: string;
    contains_id?: string;
}

interface Shapes {
    shape_id: string;
    shape_pt_lat: number;
    shape_pt_lon: number;
    shape_pt_sequence: number;
    shape_dist_traveled?: number;
}

interface Frequencies {
    trip_id: string;
    start_time: string;
    end_time: string;
    headway_secs: number;
    exact_times?: number;
}

interface Transfers {
    from_stop_id: string;
    to_stop_id: string;
    transfer_type: number;
    min_transfer_time?: number;
}

interface FeedInfo {
    feed_publisher_name: string;
    feed_publisher_url: string;
    feed_lang: string;
    feed_start_date?: string;
    feed_end_date?: string;
    feed_version?: string;
    feed_contact_email?: string;
    feed_contact_url?: string;
}

class GTFSDB extends Dexie {
    public agencies: Dexie.Table<Agency, string>;
    public stops: Dexie.Table<Stops, string>;
    public routes: Dexie.Table<Routes, string>;
    public trips: Dexie.Table<Trips, string>;
    public stopTimes: Dexie.Table<StopTimes, number>;
    public calendar: Dexie.Table<Calendar, string>;
    public calendarDates: Dexie.Table<CalendarDates, number>;
    public fareAttributes: Dexie.Table<FareAttributes, string>;
    public fareRules: Dexie.Table<FareRules, number>;
    public shapes: Dexie.Table<Shapes, number>;
    public frequencies: Dexie.Table<Frequencies, number>;
    public transfers: Dexie.Table<Transfers, number>;
    public feedInfo: Dexie.Table<FeedInfo, number>;

    public constructor() {
        super('GTFSDB');
        this.version(1).stores({
            agencies: 'agency_id',
            stops: 'stop_id,stop_name,stop_lat,stop_lon,zone_id,location_type,parent_station,level_id,platform_code',
            routes: 'route_id,agency_id,route_short_name,route_long_name,route_type',
            trips: 'route_id,service_id,trip_id,shape_id,trip_headsign,trip_short_name,direction_id,block_id',
            stopTimes: '++id, trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type,shape_dist_traveled',
            calendar: 'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date',
            calendarDates: '++id, service_id,date,exception_type',
            fareAttributes: 'fare_id',
            fareRules: '++id, fare_id',
            shapes: '++id, shape_id, shape_pt_sequence',
            frequencies: '++id, trip_id, start_time, end_time',
            transfers: '++id, from_stop_id, to_stop_id',
            feedInfo: '++id',
        });

        this.agencies = this.table('agencies');
        this.stops = this.table('stops');
        this.routes = this.table('routes');
        this.trips = this.table('trips');
        this.stopTimes = this.table('stopTimes');
        this.calendar = this.table('calendar');
        this.calendarDates = this.table('calendarDates');
        this.fareAttributes = this.table('fareAttributes');
        this.fareRules = this.table('fareRules');
        this.shapes = this.table('shapes');
        this.frequencies = this.table('frequencies');
        this.transfers = this.table('transfers');
        this.feedInfo = this.table('feedInfo');
    }
}

export const db = new GTFSDB();
