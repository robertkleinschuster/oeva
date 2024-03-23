import Dexie from 'dexie';
import {TransitFeed} from "./Feed.ts";

export class FeedDB extends Dexie {
    public transit: Dexie.Table<TransitFeed, number>

    public constructor() {
        super('Feed');
        this.version(1).stores({
            transit: '++id,[name+done]',
        });

        this.transit = this.table('transit')
    }
}

export const feedDb = new FeedDB();
