import {TransitFeed, TransitFeedStatus} from "../db/Feed";
import React from "react";

export const FeedStatus: React.FC<{ feed: TransitFeed }> = ({feed}) => (
    <>
        {feed.status === TransitFeedStatus.DRAFT ? <>Erstellt</> : null}
        {feed.status === TransitFeedStatus.DOWNLOADING ? <>Herunterladen {feed?.download_progress ? <>{feed?.download_progress} %, </> : null} {feed.downloaded_megabytes!} MB</> : null}
        {feed.status === TransitFeedStatus.IMPORTING ? <>Importieren: {feed.progress?.toString()}</> : null}
        {feed.status === TransitFeedStatus.PROCESSING ? <>Verarbeiten: {feed.progress?.toString()}</> : null}
        {feed.status === TransitFeedStatus.DONE ? <>Importiert</> : null}
        {feed.status === TransitFeedStatus.ERROR ? <>{feed.progress?.toString()}</> : null}
    </>
)

export default FeedStatus