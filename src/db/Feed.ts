import {IndexableType} from "dexie";

export enum TransitFeedStatus {
    DRAFT,
    DOWNLOADING,
    IMPORTING,
    PROCESSING,
    DONE,
    ERROR,
}

export enum TransitFeedStep {
    STATIONS,
    STOPOVERS
}

export interface TransitFeed {
    id?: number;
    url: string;
    name: string;
    step?: TransitFeedStep
    offset?: number;
    progress?: string;
    is_ifopt: boolean;
    files: Map<string, Blob> | null;
    imported: string[];
    downloaded_megabytes: number;
    download_progress: number;
    status: TransitFeedStatus;
    timestamp: number;
    last_start?: number;
}

export interface FeedDependency {
    feed: string;
    feed_id: number;
    dependency_id: IndexableType;
    table: string;
}