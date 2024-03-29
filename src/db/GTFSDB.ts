import Dexie from 'dexie';
import {
    GTFSAgency,
    GTFSCalendar,
    GTFSCalendarDate,
    GTFSFrequency,
    GTFSLevel, GTFSPathway,
    GTFSRoute,
    GTFSShape,
    GTFSStop,
    GTFSStopTime,
    GTFSTransfer,
    GTFSTrip
} from "./GTFS.ts";


export class GTFSDB extends Dexie {
    public agencies: Dexie.Table<GTFSAgency, string>;
    public stops: Dexie.Table<GTFSStop, string>;
    public routes: Dexie.Table<GTFSRoute, string>;
    public trips: Dexie.Table<GTFSTrip, string>;
    public stopTimes: Dexie.Table<GTFSStopTime, { trip_id: string, stop_id: string }>;
    public calendar: Dexie.Table<GTFSCalendar, string>;
    public calendarDates: Dexie.Table<GTFSCalendarDate, { service_id: string, date: string }>;
    public shapes: Dexie.Table<GTFSShape, string>;
    public frequencies: Dexie.Table<GTFSFrequency, string>;
    public transfers: Dexie.Table<GTFSTransfer, { from_stop_id: string, to_stop_id: string }>;
    public levels: Dexie.Table<GTFSLevel, string>;
    public pathways: Dexie.Table<GTFSPathway, string>;

    public constructor(feedId: number) {
        super('GTFS_' + feedId.toString());
        this.version(5).stores({
            agencies: 'agency_id',
            stops: 'stop_id,parent_station',
            routes: 'route_id',
            trips: 'trip_id',
            stopTimes: '[trip_id+stop_id],trip_id,stop_id',
            calendar: 'service_id',
            calendarDates: '[service_id+date],service_id',
            shapes: 'shape_id',
            frequencies: '[trip_id+start_time],trip_id',
            transfers: '[from_stop_id+to_stop_id]',
            levels: 'level_id',
            pathways: 'pathway_id',
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
