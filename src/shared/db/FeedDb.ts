import Dexie from 'dexie';
import {FeedLog, TransitFeed} from "./Feed";

export class FeedDB extends Dexie {
    public transit: Dexie.Table<TransitFeed, number>
    public log: Dexie.Table<FeedLog, number>

    public constructor() {
        super('Feed');
        this.version(10).stores({
            file: '[feed_id+name],[feed_id+status]',
            transit: '++id,status,last_start',
            log: '++id,feed_id',
        });
        this.transit = this.table('transit')
        this.log = this.table('log')
    }
}

export const feedDb = new FeedDB();
