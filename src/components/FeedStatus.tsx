import {Transit} from "../FeedDb.ts";

export const FeedStatus = ({feed}: {feed: Transit}) => {
    return <>
        {feed.done ? <p>Abgeschlossen</p> : <p>In Bearbeitung</p>}

        {feed.downloading ?
            <p>
                Herunterladen {feed?.download_progress ? <>{feed?.download_progress} %</> : null} ({Math.round(feed.downloaded_bytes! / 1000000)} MB)
            </p>
            : undefined}

        {!feed.done && !feed.downloading ?
            <p>
                Importiere {feed.current_file} ({feed.imported?.length} / {feed.files?.size})
            </p>
            : undefined}
    </>
}