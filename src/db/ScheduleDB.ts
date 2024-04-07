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
        this.version(21).stores({
            trip_stop: 'id,feed_id,trip_id,stop_id,[h3_cell+hour]',
            stop: 'id,feed_id,h3_cell,*keywords',
            trip: 'id,feed_id,*keywords',
        })

        this.trip_stop = this.table('trip_stop');
        this.stop = this.table('stop');
        this.trip = this.table('trip');
    }
}

export const scheduleDB = new ScheduleDB();
