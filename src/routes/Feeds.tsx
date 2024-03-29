import {Button, Icon, List, ListItem, Navbar, Page, Preloader} from "framework7-react";
import {useLiveQuery} from "dexie-react-hooks";
import {GTFSDB} from "../db/GTFSDB.ts";
import {useContext, useState} from "react";
import {FeedSheet} from "../components/FeedSheet.tsx";
import {FeedImporter} from "../import/FeedImporter.ts";
import axios from "axios";
import {FeedStatus} from "../components/FeedStatus.tsx";
import {AddFeedSheet} from "../components/AddFeedSheet.tsx";
import {feedDb} from "../db/FeedDb.ts";
import {TransitFeedStatus} from "../db/Feed.ts";
import {StorageQuota} from "../components/StorageQuota.tsx";
import {WorkerContext} from "../WorkerContext.tsx";
import {scheduleDB} from "../db/ScheduleDB.ts";

export const Feeds = () => {
    const feeds = useLiveQuery(() => feedDb.transit.toArray());
    const [addDialog, showAddDialog] = useState(false)
    const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null)
    const running = useContext(WorkerContext)

    return <Page name="feeds">
        <Navbar title="Feeds" backLink>
            <Button slot="right" onClick={() => {
                showAddDialog(true)
            }}>Neu</Button>
        </Navbar>
        <StorageQuota/>
        <List strong>
            {feeds?.map(feed => <ListItem
                onClick={() => setSelectedFeedId(feed.id!)}
                title={feed.name}
                key={feed.id}
            >
                <div slot="footer">
                    <FeedStatus feed={feed}/>
                </div>
                {running === feed.id ? <Preloader slot="after"/> : null}
                {feed.status === TransitFeedStatus.DONE ?
                    <Icon slot="after" color="green" f7="checkmark_circle"/> : null}
                {feed.status === TransitFeedStatus.ERROR ? <Icon slot="after" f7="exclamationmark_triangle"/> : null}
            </ListItem>)}
        </List>
        <FeedSheet feedId={selectedFeedId} onSheetClosed={() => setSelectedFeedId(null)}/>
        <AddFeedSheet open={addDialog} onCreate={async (url, name, isIfopt) => {
            const importId = await FeedImporter.create(feedDb, url, name, isIfopt)
            showAddDialog(false)
            const dataImporter = new FeedImporter(feedDb, new GTFSDB(importId), scheduleDB, axios)
            await dataImporter.startDownload(importId)
        }} onAbort={() => {
            showAddDialog(false)
        }}/>
    </Page>
};