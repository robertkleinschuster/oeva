import {Icon, List, ListItem, Navbar, Page, Button} from "framework7-react";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../GTFSDB.ts";
import {useEffect, useState} from "react";
import {ImportSheet} from "../components/ImportSheet.tsx";
import {DataImporter} from "../DataImporter.ts";
import axios from "axios";
import {ImportStatus} from "../components/ImportStatus.tsx";
import {CreateImportSheet} from "../components/CreateImportSheet.tsx";

export const Import = () => {
    const imports = useLiveQuery(() => db.import.toArray());
    const [loaded, setLoaded] = useState(false)
    const [create, setCreate] = useState(false)

    useEffect(() => {
        if (imports) {
            const dataImporter = new DataImporter(db, axios)
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
    return <Page>
        <Navbar title="Import" backLink>
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
                    <ImportStatus importData={importData}/>
                </div>
                {importData.done ? <Icon slot="after" f7="checkmark"/> : <Icon slot="after" f7="hourglass"/>}
            </ListItem>)}
        </List>
        <ImportSheet importId={selected} onSheetClosed={() => setSelected(null)}/>
        <CreateImportSheet open={create} onCreate={async (url, name) => {
            const dataImporter = new DataImporter(db, axios)
            const importId = await dataImporter.createImport(url, name)
            setCreate(false)
            await dataImporter.run(importId)
        }} onAbort={() => {
            setCreate(false)
        }}/>
    </Page>
};