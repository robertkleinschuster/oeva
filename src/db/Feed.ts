import {IndexableType} from "dexie";

export enum TransitFeedStatus {
    DRAFT,
    DOWNLOADING,
    IMPORTING,
    OPTIMIZING,
    DONE
}

export interface TransitFeed {
    id?: number;
    url: string;
    name: string;
    current_file: string | null;
    is_ifopt: boolean;
    files: Map<string, Blob> | null;
    imported: string[];
    downloaded_megabytes: number;
    download_progress: number;
    status: TransitFeedStatus;
    timestamp: number;
}

export interface FeedDependency {
    feed: string;
    feed_id: number;
    dependency_id: IndexableType;
    table: string;
}