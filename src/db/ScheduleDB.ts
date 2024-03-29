import Dexie from 'dexie';
import {Station, Stopover} from "./Schedule.ts";

export class ScheduleDB extends Dexie {
    public stopover: Dexie.Table<Stopover, { station_id: string, trip_id: string }>;
    public station: Dexie.Table<Station, string>;

    public constructor() {
        super('Schedule');
        this.version(6).stores({
            stopover: '[station_id+trip_id],[station_id+route_type],trip_id,station_id,minutes,sequence_in_trip',
            station: 'id,*stopIds,*keywords',
        });

        this.stopover = this.table('stopover');
        this.station = this.table('station');
    }
}

export const scheduleDB = new ScheduleDB();
