import {Block, BlockTitle, Button, PageContent, Sheet} from "framework7-react";
import {transitDB} from "../TransitDB.ts";
import {FeedImporter} from "../FeedImporter.ts";
import axios from "axios";
import {useLiveQuery} from "dexie-react-hooks";
import {FeedStatus} from "./FeedStatus.tsx";
import {feedDb} from "../FeedDb.ts";

export const FeedSheet = ({feedId, onSheetClosed}: { feedId: number | null, onSheetClosed: () => void }) => {
    const dataImporter = new FeedImporter(feedDb, transitDB, axios)
    const feed = useLiveQuery(() => feedId ? feedDb.transit.get(feedId) : undefined, [feedId])

    return <Sheet push backdrop closeByBackdropClick opened={Boolean(feed)} onSheetClosed={onSheetClosed} style={{height: "auto"}}>
        {feed ? <PageContent>
                <BlockTitle large>{feed.name}</BlockTitle>
                <Block>
                    <FeedStatus feed={feed}/>
                    <p className="grid grid-cols-2 grid-gap">
                        <Button color="red" onClick={async () => {
                            feedDb.transit.delete(feed.id!)
                        }}>Löschen</Button>
                        <Button onClick={async () => {
                            await dataImporter.restartImport(feed.id!)
                            await dataImporter.run(feed.id!)
                        }}>Neu Importieren</Button>
                    </p>
                </Block>
            </PageContent> :
            <PageContent>
                <BlockTitle large>Feed nicht gefunden</BlockTitle>
            </PageContent>
        }
    </Sheet>;
}