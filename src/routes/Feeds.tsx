import {Icon, List, ListItem, Navbar, Page, Button} from "framework7-react";
import {useLiveQuery} from "dexie-react-hooks";
import {transitDB} from "../db/TransitDB.ts";
import {useEffect, useState} from "react";
import {FeedSheet} from "../components/FeedSheet.tsx";
import {FeedImporter} from "../import/FeedImporter.ts";
import axios from "axios";
import {FeedStatus} from "../components/FeedStatus.tsx";
import {AddFeedSheet} from "../components/AddFeedSheet.tsx";
import {feedDb} from "../db/FeedDb.ts";

export const Feeds = () => {
    const imports = useLiveQuery(() => feedDb.transit.toArray());
    const [loaded, setLoaded] = useState(false)
    const [create, setCreate] = useState(false)

    useEffect(() => {
        if (imports) {
            const dataImporter = new FeedImporter(feedDb, transitDB, axios)
            for (const importData of imports) {
                if (!importData.done && importData.id) {
                    void dataImporter.run(importData.id)
                }
            }
        }
    }, [loaded]);

    useEffect(() => {
        if (!loaded && imports) {
            setLoaded(true)
        }
    }, [imports]);

    const [selected, setSelected] = useState<number | null>(null)
    return <Page name="feeds">
        <Navbar title="Feeds" backLink>
            <Button slot="right" onClick={() => {
                setCreate(true)
            }}>Neu</Button>
        </Navbar>
        <List strong>
            {imports?.map(importData => <ListItem
                onClick={() => setSelected(importData.id!)}
                title={importData.name}
                key={importData.id}
            >
                <div slot="footer">
                    <FeedStatus feed={importData}/>
                </div>
                {importData.done ? <Icon slot="after" f7="checkmark"/> : <Icon slot="after" f7="hourglass"/>}
            </ListItem>)}
        </List>
        <FeedSheet feedId={selected} onSheetClosed={() => setSelected(null)}/>
        <AddFeedSheet open={create} onCreate={async (url, name) => {
            const dataImporter = new FeedImporter(feedDb, transitDB, axios)
            const importId = await dataImporter.createImport(url, name)
            setCreate(false)
            await dataImporter.run(importId)
        }} onAbort={() => {
            setCreate(false)
        }}/>
    </Page>
};