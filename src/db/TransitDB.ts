import Dexie from 'dexie';
import {
    Agency,
    Calendar,
    CalendarDate,
    Frequency,
    Level, Pathway,
    Route,
    Shape,
    Stop,
    StopTime,
    Transfer,
    Trip
} from "./Transit.ts";


export class TransitDB extends Dexie {
    public agencies: Dexie.Table<Agency, string>;
    public stops: Dexie.Table<Stop, string>;
    public routes: Dexie.Table<Route, string>;
    public trips: Dexie.Table<Trip, string>;
    public stopTimes: Dexie.Table<StopTime, {trip_id: string, stop_id: string}>;
    public calendar: Dexie.Table<Calendar, string>;
    public calendarDates: Dexie.Table<CalendarDate, {service_id: string, date: string}>;
    public shapes: Dexie.Table<Shape, string>;
    public frequencies: Dexie.Table<Frequency, string>;
    public transfers: Dexie.Table<Transfer, {from_stop_id: string, to_stop_id: string}>;
    public levels: Dexie.Table<Level, string>;
    public pathways: Dexie.Table<Pathway, string>;

    public constructor() {
        super('Transit');
        this.version(3).stores({
            agencies: 'agency_id,*tokens',
            stops: 'stop_id,stop_name,parent_station,[stop_lat+stop_lon],*tokens',
            routes: 'route_id,route_type,*tokens',
            trips: 'trip_id,route_id,shape_id,direction_id,*tokens',
            stopTimes: '[trip_id+stop_id],trip_id,stop_id',
            calendar: 'service_id,[service_id+start_date+end_date]',
            calendarDates: '[service_id+date],service_id',
            shapes: 'shape_id',
            frequencies: '[trip_id+start_time],trip_id',
            transfers: '[from_stop_id+to_stop_id]',
            levels: 'level_id,level_index,level_name',
            pathways: 'pathway_id,[from_stop_id+to_stop_id+is_bidirectional]',
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
