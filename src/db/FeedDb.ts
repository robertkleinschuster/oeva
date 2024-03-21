import Dexie from 'dexie';

export interface TransitFeed {
    id?: number;
    url: string;
    name: string;
    current_file: string | null;
    files: Map<string, Blob> | null;
    imported: string[] | null;
    downloading: number;
    downloaded_bytes: number;
    download_progress: number;
    done: number;
    timestamp: number;
}

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
