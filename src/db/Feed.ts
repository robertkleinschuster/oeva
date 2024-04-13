export enum TransitFeedStatus {
    DRAFT,
    DOWNLOADING,
    SAVING,
    PROCESSING,
    PROCESSING_KEYWORDS,
    DONE,
    ERROR,
    ABORTED,
}

export const stoppedStatuses = [
    TransitFeedStatus.DRAFT,
    TransitFeedStatus.ERROR,
    TransitFeedStatus.DONE,
    TransitFeedStatus.ABORTED,
]

export enum TransitFeedStep {
    STOPS,
    TRIPSTOPS,
    TRIPS
}

export interface TransitFeed {
    id?: number;
    url: string;
    name: string;
    keywords?: string,
    step?: TransitFeedStep
    offset?: number;
    progress?: string;
    downloaded_megabytes?: number;
    download_progress?: number;
    status: TransitFeedStatus;
    previous_status?: TransitFeedStatus;
    timestamp?: number;
    last_start?: number;
}

export enum FeedFileStatus {
    IMPORT_PENDING,
    IMPORTED,
}

export interface FeedFile {
    feed_id: number;
    name: string;
    type: string;
    status: FeedFileStatus;
    content: Uint8Array;
}

export interface FeedLog {
    feed_id: number;
    message: string;
}
