import Dexie from 'dexie';
import {Station, Stopover, Trip} from "./Schedule";

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
        }).upgrade(async trans => {
            await trans.table('stopover').clear()
            await trans.table('station').clear()
            await trans.table('trip').clear()
        });

        this.stopover = this.table('stopover');
        this.station = this.table('station');
        this.trip = this.table('trip');
    }
}

export const scheduleDB = new ScheduleDB();
