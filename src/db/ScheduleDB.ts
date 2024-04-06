import Dexie from 'dexie';
import {Stop, TripStop, Trip} from "./Schedule";
import {feedDb} from "./FeedDb";
import {stoppedStatuses, TransitFeedStatus} from "./Feed";

export class ScheduleDB extends Dexie {
    public trip_stop: Dexie.Table<TripStop, string>;
    public stop: Dexie.Table<Stop, string>;
    public trip: Dexie.Table<Trip, string>;

    public constructor() {
        super('Schedule');
        this.version(18).stores({
            trip_stop: 'id,trip_id,stop_id,[h3_cell+hour]',
            stop: 'id,h3_cell,*keywords',
            trip: 'id,*keywords',
        })

        this.trip_stop = this.table('trip_stop');
        this.stop = this.table('stop');
        this.trip = this.table('trip');
    }
}

export const scheduleDB = new ScheduleDB();
