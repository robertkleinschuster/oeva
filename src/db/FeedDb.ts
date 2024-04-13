import Dexie from 'dexie';
import {FeedFile, FeedLog, TransitFeed} from "./Feed";

export class FeedDB extends Dexie {
    public transit: Dexie.Table<TransitFeed, number>
    public file: Dexie.Table<FeedFile, number>
    public log: Dexie.Table<FeedLog, number>

    public constructor() {
        super('Feed');
        this.version(9).stores({
            file: '[feed_id+name],[feed_id+status]',
            transit: '++id,status',
            log: '++id,feed_id',
        });
        this.file = this.table('file')
        this.transit = this.table('transit')
        this.log = this.table('log')
    }
}

export const feedDb = new FeedDB();
