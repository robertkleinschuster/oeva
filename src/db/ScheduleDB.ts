import Dexie from 'dexie';
import {Station, Stopover, Trip} from "./Schedule";

export class ScheduleDB extends Dexie {
    public stopover: Dexie.Table<Stopover, { station_id: string, trip_id: string }>;
    public station: Dexie.Table<Station, string>;
    public trip: Dexie.Table<Trip, string>;

    public constructor() {
        super('Schedule');
        this.version(9).stores({
            stopover: '[station_id+trip_id],[station_id+route_type],[h3_cell+route_type],trip_id,station_id,h3_cell,minutes,sequence_in_trip',
            station: 'id,*stop_ids,*h3_cells,*keywords',
            trip: 'id,*stop_ids,*keywords',
        });

        this.stopover = this.table('stopover');
        this.station = this.table('station');
        this.trip = this.table('trip');
    }
}

export const scheduleDB = new ScheduleDB();
