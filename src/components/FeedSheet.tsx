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

    const stops = useLiveQuery(() => feedId ? feedDb.dependency.where({feed: 'transit', feed_id: feedId, table: 'stops'}).count() : 0, [feedId]);
    const routes = useLiveQuery(() => feedId ? feedDb.dependency.where({feed: 'transit', feed_id: feedId, table: 'routes'}).count() : 0, [feedId]);
    const trips = useLiveQuery(() => feedId ? feedDb.dependency.where({feed: 'transit', feed_id: feedId, table: 'trips'}).count() : 0, [feedId]);

    return <Sheet push backdrop closeByBackdropClick opened={Boolean(feed)} onSheetClosed={onSheetClosed} style={{height: "auto"}}>
        {feed ? <PageContent>
                <BlockTitle large>{feed.name}</BlockTitle>
                <Block>
                    <FeedStatus feed={feed}/>
                    <p>Quelle: {feed.url}</p>
                    <p>Haltepunkte: {stops}</p>
                    <p>Routen: {routes}</p>
                    <p>Fahrten: {trips}</p>
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