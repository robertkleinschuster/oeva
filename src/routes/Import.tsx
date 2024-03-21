import {Icon, List, ListItem, Navbar, Page, Button, f7} from "framework7-react";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../GTFSDB.ts";
import {useEffect, useState} from "react";
import {ImportSheet} from "../components/ImportSheet.tsx";
import {DataImporter} from "../DataImporter.ts";
import axios from "axios";
import {ImportStatus} from "../components/ImportStatus.tsx";

export const Import = () => {
    const imports = useLiveQuery(() => db.import.toArray());
    const [loaded, setLoaded] = useState<boolean>(false)

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
                f7.dialog.prompt('Gib einen Namen für diesen Import ein.', (name) => {
                    f7.dialog.prompt('Gib die URL zu einem GTFS ZIP-Archiv an.', (url) => {
                        const dataImporter = new DataImporter(db, axios)
                        dataImporter.createImport(url, name)
                    })
                });
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
    </Page>
};