import {TransitFeed, TransitFeedStatus} from "../db/Feed.ts";

export const FeedStatus = ({feed}: {feed: TransitFeed}) => {
    return <p>
        {feed.status === TransitFeedStatus.DRAFT ? <>Erstellt</> : null}
        {feed.status === TransitFeedStatus.DOWNLOADING ? <>Herunterladen {feed?.download_progress ? <>{feed?.download_progress} %</> : null} {feed.downloaded_megabytes!} MB</> : null}
        {feed.status === TransitFeedStatus.IMPORTING ? <>Importieren {feed.current_file} ({feed.imported.length + 1} / {feed.files?.size})</> : null}
        {feed.status === TransitFeedStatus.OPTIMIZING ? <>Optimieren</> : null}
        {feed.status === TransitFeedStatus.DONE ? <>Abgeschlossen</> : null}
    </p>
}