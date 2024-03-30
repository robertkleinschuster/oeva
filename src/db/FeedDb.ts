import Dexie from 'dexie';
import {FeedFile, TransitFeed} from "./Feed";

export class FeedDB extends Dexie {
    public transit: Dexie.Table<TransitFeed, number>
    public file: Dexie.Table<FeedFile, number>

    public constructor() {
        super('Feed');
        this.version(8).stores({
            file: '[feed_id+name],[feed_id+status]',
            transit: '++id,status',
        });
        this.file = this.table('file')
        this.transit = this.table('transit')
    }
}

export const feedDb = new FeedDB();
