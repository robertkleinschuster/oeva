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
    downloaded_megabytes: number;
    download_progress: number;
    status: TransitFeedStatus;
    timestamp: number;
    last_start?: number;
}

export enum FeedFileStatus {
    IMPORT_PENDING,
    IMPORTED,
}

export interface FeedFile {
    feed_id: number;
    filename: string;
    mimeType: string;
    status: FeedFileStatus;
    data: ArrayBuffer;
}
