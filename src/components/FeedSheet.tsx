import {Block, BlockTitle, Button, List, ListItem, PageContent, Sheet, Toggle} from "framework7-react";
import {GTFSDB} from "../db/GTFSDB.ts";
import {FeedImporter} from "../import/FeedImporter.ts";
import axios from "axios";
import {useLiveQuery} from "dexie-react-hooks";
import {FeedStatus} from "./FeedStatus.tsx";
import {feedDb} from "../db/FeedDb.ts";
import {TransitFeedStatus} from "../db/Feed.ts";
import {scheduleDB} from "../db/ScheduleDB.ts";

export const FeedSheet = ({feedId, onSheetClosed}: { feedId: number | null, onSheetClosed: () => void }) => {
    const feed = useLiveQuery(() => feedId ? feedDb.transit.get(feedId) : undefined, [feedId])
    const gtfsDB = feedId ?  new GTFSDB(feedId) : undefined;
    const dataImporter = gtfsDB ? new FeedImporter(feedDb, gtfsDB, scheduleDB, axios) : undefined

    return <Sheet push backdrop closeByBackdropClick opened={Boolean(feed)} onSheetClosed={onSheetClosed}
                  style={{height: "auto"}}>
        {feed ? <PageContent>
                <BlockTitle large>{feed.name}</BlockTitle>
                <Block>
                    <FeedStatus feed={feed}/>
                    <p>Quelle: {feed.url}</p>
                    <List outline>
                        <ListItem>
                            <span>Verwendet IFOPT</span>
                            <Toggle disabled={feed.status !== TransitFeedStatus.DONE} checked={feed.is_ifopt} onChange={() => {
                                feedDb.transit.update(feed.id!, {
                                    is_ifopt: !feed.is_ifopt
                                })
                            }}/>
                        </ListItem>
                    </List>
                        <p>
                            <Button disabled={feed.status !== TransitFeedStatus.DONE && feed.status !== TransitFeedStatus.ERROR} color="red" onClick={async () => {
                                await feedDb.transit.delete(feed.id!)
                                await feedDb.file.where({feed_id: feed?.id!}).delete()
                                await gtfsDB?.delete()
                            }}>Löschen</Button>
                        </p>
                        <p className="grid grid-cols-3 grid-gap">
                            <Button disabled={feed.status !== TransitFeedStatus.DONE && feed.status !== TransitFeedStatus.ERROR} onClick={() => {
                                void dataImporter?.startDownload(feed.id!)
                            }}>Herunterladen</Button>
                            <Button disabled={feed.status !== TransitFeedStatus.DONE && feed.status !== TransitFeedStatus.ERROR} onClick={() => {
                                void dataImporter?.startImport(feed.id!)
                            }}>Importieren</Button>
                            <Button disabled={feed.status !== TransitFeedStatus.DONE && feed.status !== TransitFeedStatus.ERROR} onClick={() => {
                                void dataImporter?.startProcessing(feed.id!)
                            }}>Verarbeiten</Button>
                        </p>

                </Block>
            </PageContent> :
            <PageContent>
                <BlockTitle large>Feed nicht gefunden</BlockTitle>
            </PageContent>
        }
    </Sheet>;
}