import {TransitFeed, TransitFeedStatus} from "../db/Feed";
import React from "react";

export const FeedStatus: React.FC<{ feed: TransitFeed }> = ({feed}) => (
    <>
        {feed.status === TransitFeedStatus.DRAFT ? <>Erstellt</> : null}
        {feed.status === TransitFeedStatus.DOWNLOADING ? <>Herunterladen (Schritt 1 / 3){feed?.download_progress ? <>: {feed?.download_progress} %, {feed.downloaded_megabytes!} MB</> : null}</> : null}
        {feed.status === TransitFeedStatus.SAVING ? <>Speichern (Schritt 2 / 3){feed.progress ? <>: {feed.progress?.toString()}</> : null}</> : null}
        {feed.status === TransitFeedStatus.PROCESSING ? <>Importieren (Schritt 3 / 3){feed.progress ? <>: {feed.progress?.toString()}</> : null}</> : null}
        {feed.status === TransitFeedStatus.PROCESSING_QUICK ? <>Schnellimport{feed.progress ? <>: {feed.progress?.toString()}</> : null}</> : null}
        {feed.status === TransitFeedStatus.DONE ? <>Importiert</> : null}
        {feed.status === TransitFeedStatus.ABORTED ? <>Abgebrochen</> : null}
        {feed.status === TransitFeedStatus.ERROR ? <>Fehler: {feed.progress?.toString()}</> : null}
    </>
)

export default FeedStatus