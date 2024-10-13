export interface GTFSAgency {
    agency_id: string;
    agency_name: string;
    agency_url: string;
    agency_timezone: string;
    agency_lang?: string;
    agency_phone?: string;
    agency_fare_url?: string;
    agency_email?: string;
}

export interface GTFSStop {
    stop_id: string;
    stop_code?: string;
    stop_name: string;
    stop_desc?: string;
    stop_lat: string;
    stop_lon: string;
    zone_id?: string;
    stop_url?: string;
    location_type?: string;
    parent_station?: string;
    stop_timezone?: string;
    wheelchair_boarding?: string;
    level_id?: string;
    platform_code?: string;
}

export interface GTFSRoute {
    route_id: string;
    agency_id?: string;
    route_short_name: string;
    route_long_name: string;
    route_desc?: string;
    route_type: string;
    route_url?: string;
    route_color?: string;
    route_text_color?: string;
    route_sort_order?: string;
    continuous_pickup?: string;
    continuous_drop_off?: string;
}

export interface GTFSTrip {
    trip_id: string;
    route_id: string;
    service_id: string;
    trip_headsign?: string;
    trip_short_name?: string;
    direction_id?: string;
    block_id?: string;
    shape_id?: string;
    wheelchair_accessible?: string;
    bikes_allowed?: string;
}

export interface GTFSStopTime {
    trip_id: string;
    arrival_time?: string;
    departure_time?: string;
    stop_id: string;
    stop_sequence: string;
    stop_headsign?: string;
    pickup_type?: string;
    drop_off_type?: string;
    continuous_pickup?: string;
    continuous_drop_off?: string;
    shape_dist_traveled?: string;
    timepoint?: string;
}

export interface GTFSCalendar {
    service_id: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    start_date: string;
    end_date: string;
}

export enum ExceptionType {
    RUNNING = 1,
    NOT_RUNNING = 2
}

export interface GTFSCalendarDate {
    service_id: string;
    date: string;
    exception_type: string;
}

export interface GTFSShape {
    shape_id: string;
    shape_pt_lat: string;
    shape_pt_lon: string;
    shape_pt_sequence: string;
    shape_dist_traveled?: string;
}

export interface GTFSFrequency {
    trip_id: string;
    start_time: string;
    end_time: string;
    headway_secs: string;
    exact_times?: string;
}

export interface GTFSTransfer {
    from_stop_id: string;
    to_stop_id: string;
    transfer_type: string;
    min_transfer_time?: string;
}

export interface GTFSLevel {
    level_id: string;
    level_index: string;
    level_name: string;
}

export interface GTFSPathway {
    pathway_id: string;
    from_stop_id: string;
    to_stop_id: string;
    pathway_mode: string;
    is_bidirectional: string;
    traversal_time: string;
}