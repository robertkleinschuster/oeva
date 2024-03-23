import {Block, BlockTitle, Button, List, ListItem, PageContent, Sheet, Toggle} from "framework7-react";
import {transitDB} from "../db/TransitDB.ts";
import {FeedImporter} from "../import/FeedImporter.ts";
import axios from "axios";
import {useLiveQuery} from "dexie-react-hooks";
import {FeedStatus} from "./FeedStatus.tsx";
import {feedDb} from "../db/FeedDb.ts";

export const FeedSheet = ({feedId, onSheetClosed}: { feedId: number | null, onSheetClosed: () => void}) => {
    const dataImporter = new FeedImporter(feedDb, transitDB, axios)
    const feed = useLiveQuery(() => feedId ? feedDb.transit.get(feedId) : undefined, [feedId])

    return <Sheet push backdrop closeByBackdropClick opened={Boolean(feed)} onSheetClosed={onSheetClosed} style={{height: "auto"}}>
        {feed ? <PageContent>
                <BlockTitle large>{feed.name}</BlockTitle>
                <Block>
                    <FeedStatus feed={feed}/>
                    <p>Quelle: {feed.url}</p>
                    <List outline>
                        <ListItem>
                            <span>Verwendet IFOPT</span>
                            <Toggle checked={feed.is_ifopt} onChange={() => {
                                feedDb.transit.update(feed.id!, {
                                    is_ifopt: !feed.is_ifopt
                                })
                            }}/>
                        </ListItem>
                    </List>
                    <p>
                        <Button color="red" onClick={async () => {
                            feedDb.transit.delete(feed.id!)
                            transitDB.stops.where({feed_id: feed.id}).delete()
                            transitDB.stopTimes.where({feed_id: feed.id}).delete()
                            transitDB.routes.where({feed_id: feed.id}).delete()
                            transitDB.agencies.where({feed_id: feed.id}).delete()
                            transitDB.calendar.where({feed_id: feed.id}).delete()
                            transitDB.calendarDates.where({feed_id: feed.id}).delete()
                            transitDB.transfers.where({feed_id: feed.id}).delete()
                            transitDB.trips.where({feed_id: feed.id}).delete()
                            transitDB.levels.where({feed_id: feed.id}).delete()
                            transitDB.pathways.where({feed_id: feed.id}).delete()
                            transitDB.shapes.where({feed_id: feed.id}).delete()
                            transitDB.frequencies.where({feed_id: feed.id}).delete()
                        }}>Löschen</Button>
                    </p>
                    <p className="grid grid-cols-3 grid-gap">
                        <Button onClick={async () => {
                            await dataImporter.startDownload(feed.id!)
                        }}>Herunterladen</Button>
                        <Button onClick={async () => {
                            await dataImporter.startImport(feed.id!)
                        }}>Importieren</Button>
                        <Button onClick={async () => {
                            await dataImporter.startOptimize(feed.id!)
                        }}>Optimieren</Button>
                    </p>
                </Block>
            </PageContent> :
            <PageContent>
                <BlockTitle large>Feed nicht gefunden</BlockTitle>
            </PageContent>
        }
    </Sheet>;
}