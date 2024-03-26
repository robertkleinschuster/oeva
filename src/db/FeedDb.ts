import Dexie from 'dexie';
import {FeedDependency, TransitFeed} from "./Feed.ts";

export class FeedDB extends Dexie {
    public dependency: Dexie.Table<FeedDependency, number>
    public transit: Dexie.Table<TransitFeed, number>

    public constructor() {
        super('Feed');
        this.version(5).stores({
            dependency: '[feed+table+feed_id+dependency_id],[feed+table+feed_id],[feed+table+dependency_id]',
            transit: '++id,status',
        });
        this.dependency = this.table('dependency')
        this.transit = this.table('transit')
    }
}

export const feedDb = new FeedDB();
