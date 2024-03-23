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
    imported: string[] | null;
    downloaded_megabytes: number;
    download_progress: number;
    status: TransitFeedStatus;
    timestamp: number;
}
