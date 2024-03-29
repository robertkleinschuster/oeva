import Dexie from 'dexie';
import {FeedFile, TransitFeed} from "./Feed.ts";

export class FeedDB extends Dexie {
    public transit: Dexie.Table<TransitFeed, number>
    public file: Dexie.Table<FeedFile, number>

    public constructor() {
        super('Feed');
        this.version(6).stores({
            dependency: '[feed+table+feed_id+dependency_id],[feed+table+feed_id],[feed+table+dependency_id]',
            file: '[feed_id+filename],[feed_id+status]',
            transit: '++id,status',
        });
        this.file = this.table('file')
        this.transit = this.table('transit')
    }
}

export const feedDb = new FeedDB();
