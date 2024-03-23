import {Block, BlockTitle, Button, List, ListItem, PageContent, Sheet, Toggle} from "framework7-react";
import {transitDB} from "../db/TransitDB.ts";
import {FeedImporter} from "../import/FeedImporter.ts";
import axios from "axios";
import {useLiveQuery} from "dexie-react-hooks";
import {FeedStatus} from "./FeedStatus.tsx";
import {feedDb} from "../db/FeedDb.ts";
import {TransitFeedStatus} from "../db/Feed.ts";

export const FeedSheet = ({feedId, onSheetClosed}: { feedId: number | null, onSheetClosed: () => void }) => {
    const dataImporter = new FeedImporter(feedDb, transitDB, axios)
    const feed = useLiveQuery(() => feedId ? feedDb.transit.get(feedId) : undefined, [feedId])

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
                            <Button disabled={feed.status !== TransitFeedStatus.DONE} color="red" onClick={async () => {
                                feedDb.transit.delete(feed.id!)
                            }}>Löschen</Button>
                        </p>
                        <p className="grid grid-cols-3 grid-gap">
                            <Button disabled={feed.status !== TransitFeedStatus.DONE} onClick={async () => {
                                await dataImporter.startDownload(feed.id!)
                            }}>Herunterladen</Button>
                            <Button disabled={feed.status !== TransitFeedStatus.DONE} onClick={async () => {
                                await dataImporter.startImport(feed.id!)
                            }}>Importieren</Button>
                            <Button disabled={feed.status !== TransitFeedStatus.DONE} onClick={async () => {
                                await dataImporter.startOptimize(feed.id!)
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