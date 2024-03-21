import {Block, BlockTitle, Button, PageContent, Sheet} from "framework7-react";
import {db} from "../GTFSDB.ts";
import {DataImporter} from "../DataImporter.ts";
import axios from "axios";
import {useLiveQuery} from "dexie-react-hooks";
import {ImportStatus} from "./ImportStatus.tsx";

export const ImportSheet = ({importId, onSheetClosed}: { importId: number | null, onSheetClosed: () => void }) => {
    const dataImporter = new DataImporter(db, axios)
    const importData = useLiveQuery(() => importId ? db.import.get(importId) : undefined, [importId])

    return <Sheet push backdrop closeByBackdropClick opened={Boolean(importData)} onSheetClosed={onSheetClosed}>
        <div className="swipe-handler"></div>
        {importData ? <PageContent>
                <BlockTitle large>{importData.name}</BlockTitle>
                <Block>
                    <ImportStatus importData={importData}/>
                    <Button onClick={async () => {
                        await dataImporter.restartImport(importData.id!)
                        await dataImporter.downloadData(importData.id!)
                        await dataImporter.runImport(importData.id!)
                    }}>Neu Importieren</Button>
                    <Button color="red" onClick={async () => {
                       db.import.delete(importData.id!)
                    }}>Löschen</Button>
                </Block>
            </PageContent> :
            <PageContent>
                <BlockTitle large>Import nicht gefunden</BlockTitle>
            </PageContent>
        }
    </Sheet>;
}