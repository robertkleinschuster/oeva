import Dexie from 'dexie';
import {Station, Stopover, Trip} from "./Schedule";
import {feedDb} from "./FeedDb";
import {stoppedStatuses, TransitFeedStatus} from "./Feed";

export class ScheduleDB extends Dexie {
    public stopover: Dexie.Table<Stopover, string>;
    public station: Dexie.Table<Station, string>;
    public trip: Dexie.Table<Trip, string>;

    public constructor() {
        super('Schedule');
        this.version(14).stores({
            stopover: 'id,trip_id,station_id,[h3_cell+minutes]',
            station: 'id,h3_cell,*keywords',
            trip: 'id,*keywords',
        }).upgrade(async () => {
            await feedDb.transit.each(async feed => {
                if (stoppedStatuses.includes(feed.status)) {
                    await feedDb.transit.update(feed, {
                        status: TransitFeedStatus.PROCESSING
                    })
                }
            })
        });

        this.stopover = this.table('stopover');
        this.station = this.table('station');
        this.trip = this.table('trip');
    }
}

export const scheduleDB = new ScheduleDB();
