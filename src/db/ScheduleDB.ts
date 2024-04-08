import Dexie from 'dexie';
import {Stop, TripStop, Trip} from "./Schedule";

export class ScheduleDB extends Dexie {
    public trip_stop: Dexie.Table<TripStop, string>;
    public stop: Dexie.Table<Stop, string>;
    public trip: Dexie.Table<Trip, string>;

    public constructor() {
        super('Schedule');
        this.version(24).stores({
            trip_stop: 'id,feed_id,trip_id,stop_id,[h3_cell_le1+h3_cell_le2+hour]',
            stop: 'id,feed_id,[h3_cell_le1+h3_cell_le2],*keywords',
            trip: 'id,feed_id,*keywords',
        })

        this.trip_stop = this.table('trip_stop');
        this.stop = this.table('stop');
        this.trip = this.table('trip');
    }
}

export const scheduleDB = new ScheduleDB();
