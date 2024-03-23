import {Button, Icon, List, ListItem, Navbar, Page} from "framework7-react";
import {useLiveQuery} from "dexie-react-hooks";
import {transitDB} from "../db/TransitDB.ts";
import {useEffect, useState} from "react";
import {FeedSheet} from "../components/FeedSheet.tsx";
import {FeedImporter} from "../import/FeedImporter.ts";
import axios from "axios";
import {FeedStatus} from "../components/FeedStatus.tsx";
import {AddFeedSheet} from "../components/AddFeedSheet.tsx";
import {feedDb} from "../db/FeedDb.ts";
import {TransitFeed, TransitFeedStatus} from "../db/Feed.ts";

const runningFeeds = new Set<number>();
async function runFeeds(feeds: TransitFeed[]) {
    const dataImporter = new FeedImporter(feedDb, transitDB, axios)
    for (const feed of feeds) {
        if (feed.id && !runningFeeds.has(feed.id)) {
            runningFeeds.add(feed.id)
            try {
                if (feed.status != TransitFeedStatus.DONE ) {
                    await dataImporter.run(feed.id)
                }
            } catch (error) {
                console.error(error)
            }
            runningFeeds.delete(feed.id)
        }
    }
}

export const Feeds = () => {
    const feeds = useLiveQuery(() => feedDb.transit.toArray());
    const [addDialog, showAddDialog] = useState(false)
    const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null)

    useEffect(() => {
        if (feeds) {
            void runFeeds(feeds)
        }
    }, [feeds]);

    return <Page name="feeds">
        <Navbar title="Feeds" backLink>
            <Button slot="right" onClick={() => {
                showAddDialog(true)
            }}>Neu</Button>
        </Navbar>
        <List strong>
            {feeds?.map(feed => <ListItem
                onClick={() => setSelectedFeedId(feed.id!)}
                title={feed.name}
                key={feed.id}
            >
                <div slot="footer">
                    <FeedStatus feed={feed}/>
                </div>
                {runningFeeds.has(feed.id!) ? <Icon slot="after" f7="hourglass"/> : <Icon slot="after" f7="checkmark"/>}
            </ListItem>)}
        </List>
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