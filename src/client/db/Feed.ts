export enum TransitFeedStatus {
    DRAFT,
    DOWNLOADING,
    EXTRACTING,
    IMPORTING,
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

export interface TransitFeed {
    id?: number;
    url: string;
    name: string;
    keywords?: string,
    status: TransitFeedStatus;
    previous_status?: TransitFeedStatus;
    timestamp?: number;
    last_start?: number;
}

export interface FeedLog {
    id?: number;
    feed_id: number;
    message: string;
}
