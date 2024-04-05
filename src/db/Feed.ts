export enum TransitFeedStatus {
    DRAFT,
    DOWNLOADING,
    IMPORTING,
    PROCESSING,
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
    step?: TransitFeedStep
    offset?: number;
    progress?: string;
    is_ifopt: boolean;
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
