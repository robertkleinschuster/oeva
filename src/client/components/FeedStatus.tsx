import {TransitFeed, TransitFeedStatus} from "../../shared/db/Feed";
import React from "react";

export const FeedStatus: React.FC<{ feed: TransitFeed }> = ({feed}) => (
    <>
        {feed.status === TransitFeedStatus.DRAFT ? <>Erstellt</> : null}
        {feed.status === TransitFeedStatus.DOWNLOADING ? <>Herunterladen</> : null}
        {feed.status === TransitFeedStatus.EXTRACTING ? <>Extrahieren</> : null}
        {feed.status === TransitFeedStatus.IMPORTING ? <>Importieren</> : null}
        {feed.status === TransitFeedStatus.DONE ? <>Importiert</> : null}
        {feed.status === TransitFeedStatus.ABORTED ? <>Abgebrochen</> : null}
        {feed.status === TransitFeedStatus.ERROR ? <>Fehler</> : null}
    </>
)

export default FeedStatus