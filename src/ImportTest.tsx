import StationSearch from "./StationSearch.tsx";
import {useState} from "react";
import {db} from './GTFSDB';
import axios from "axios";
import {DataImporter} from "./DataImporter";
import {Button} from "framework7-react";

function ImportTest() {
    const [importingData, setImportingData] = useState<boolean>(false)
    const [downloadingData, setDownloadingData] = useState<boolean>(false)
    const [importFinished, setImportFinished] = useState<boolean>(false)
    const dataImporter = new DataImporter(db, axios);

    const updateData = (importId: number) => {
        setImportingData(true)

        db.import.get(importId)
            .then(async currentImport => {
                if (currentImport?.files) {
                    await dataImporter.runImport(importId)
                    setImportFinished(true)
                } else {
                    setDownloadingData(true)
                    await dataImporter.downloadData(importId)
                    setDownloadingData(false)
                    await dataImporter.runImport(importId)
                    setImportFinished(true)
                }
            })
    }

    const handleUpdate = async () => {
        const unfinishedImports = await db.import.where({name: 'oebb', done: 0}).primaryKeys();
        const unfinishedImportId = unfinishedImports.pop();
        if (unfinishedImportId) {
            updateData(unfinishedImportId)
        } else {
            updateData(await dataImporter.createImport(
                "https://static.oebb.at/open-data/soll-fahrplan-gtfs/GTFS_OP_2024_obb.zip",
                'oebb'
            ))
        }
    }

    return (
        <>
            {!downloadingData && !importingData ?
                <div>
                    <Button onClick={handleUpdate}>Update data</Button>
                </div>
                : null}
            {importingData ? importFinished ? <p>Import done</p> :
                <p>Importing data</p> : null}

            <StationSearch/>
        </>
    )
}

export default ImportTest
