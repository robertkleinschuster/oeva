import {Button, Icon, List, ListItem, Navbar, Page, Preloader} from "framework7-react";
import {useLiveQuery} from "dexie-react-hooks";
import {transitDB} from "../db/TransitDB.ts";
import {useState} from "react";
import {FeedSheet} from "../components/FeedSheet.tsx";
import {FeedImporter} from "../import/FeedImporter.ts";
import axios from "axios";
import {FeedStatus} from "../components/FeedStatus.tsx";
import {AddFeedSheet} from "../components/AddFeedSheet.tsx";
import {feedDb} from "../db/FeedDb.ts";
import {TransitFeedStatus} from "../db/Feed.ts";
import {StorageQuota} from "../components/StorageQuota.tsx";
import {StoragePrompt} from "../components/StoragePrompt.tsx";

const runningFeeds = new Set<number>();

setInterval(async () => {
    await runFeeds()
}, 5000)

async function runFeeds() {
    const feeds = await feedDb.transit.toArray()
    const dataImporter = new FeedImporter(feedDb, transitDB, axios)
    for (const feed of feeds) {
        if (feed.id && !runningFeeds.has(feed.id)) {
            if (feed.status != TransitFeedStatus.DONE && feed.status !== TransitFeedStatus.ERROR) {
                try {
                    runningFeeds.add(feed.id)
                    await dataImporter.run(feed.id)
                } catch (error) {
                    runningFeeds.delete(feed.id)
                    console.error(error)
                    feedDb.transit.update(feed.id, {
                        status: TransitFeedStatus.ERROR
                    });
                }
                runningFeeds.delete(feed.id)
            }
        }
    }
}

export const Feeds = () => {
    const feeds = useLiveQuery(() => feedDb.transit.toArray());
    const [addDialog, showAddDialog] = useState(false)
    const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null)

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
                {runningFeeds.has(feed.id!) ? <Preloader slot="after"/> : null}
                {feed.status === TransitFeedStatus.DONE ?
                    <Icon slot="after" color="green" f7="checkmark_circle"/> : null}
                {feed.status === TransitFeedStatus.ERROR ? <Icon slot="after" f7="exclamationmark_triangle"/> : null}
            </ListItem>)}
        </List>
        <StoragePrompt/>
        <FeedSheet feedId={selectedFeedId} onSheetClosed={() => setSelectedFeedId(null)}/>
        <AddFeedSheet open={addDialog} onCreate={async (url, name, isIfopt) => {
            const dataImporter = new FeedImporter(feedDb, transitDB, axios)
            const importId = await dataImporter.create(url, name, isIfopt)
            showAddDialog(false)
            await dataImporter.startDownload(importId)
        }} onAbort={() => {
            showAddDialog(false)
        }}/>
    </Page>
};