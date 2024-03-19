import {useRegisterSW} from "virtual:pwa-register/react";
import StationSearch from "./StationSearch.tsx";
import {useState} from "react";
import {db} from './GTFSDB';
import axios, {AxiosProgressEvent} from "axios";
import {DataImporter} from "./DataImporter";
import {Button} from "framework7-react";

function ImportTest() {
    const [importingData, setImportingData] = useState<boolean>(false)
    const [downloadingData, setDownloadingData] = useState<boolean>(false)
    const [importFinished, setImportFinished] = useState<boolean>(false)
    const [updateMessage, setUpdateMessage] = useState<string>('')
    const [currentFilename, setCurrentFilename] = useState<string | null>(null)
    const [downloadStats, setDownloadStats] = useState<AxiosProgressEvent | null>(null)
    const dataImporter = new DataImporter(db, axios);

    const updateData = (importId: number) => {
        setImportingData(true)

        db.import.get(importId)
            .then(async currentImport => {
                if (currentImport?.files) {
                    await dataImporter.runImport(importId, (finished, open, filename) => {
                        setUpdateMessage(`${finished} / ${open}`);
                        setCurrentFilename(filename)
                    })
                    setImportFinished(true)
                } else {
                    setDownloadingData(true)
                    await dataImporter.downloadData(importId, setDownloadStats)
                    setDownloadingData(false)
                    await dataImporter.runImport(importId, (finished, open, filename) => {
                        setUpdateMessage(`${finished} / ${open}`);
                        setCurrentFilename(filename)
                    })
                    setImportFinished(true)
                }
            })
    }

    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        async onRegisteredSW(r) {
            console.log('SW Registered: ', r);
        },
        onRegisterError(error) {
            console.error('SW Registration Error: ', error);
        },
    });

    const handleRefresh = () => {
        void updateServiceWorker(true);
    };

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
            {needRefresh && (
                <div>
                    <p>A new update is available!</p>
                    <Button onClick={handleRefresh}>Refresh</Button>
                </div>
            )}
            {!downloadingData && !importingData ?
                <div>
                    <Button onClick={handleUpdate}>Update data</Button>
                </div>
                : null}
            {downloadingData ?
                <p>
                    Downloading
                    data: {Math.round((downloadStats?.loaded ?? 0) / 1000000)} / {Math.round((downloadStats?.total ?? 0) / 1000000)} MB
                </p>
                : null}
            {importingData ? importFinished ? <p>Import done</p> :
                <p>Importing data: {currentFilename} ({updateMessage})</p> : null}

            <StationSearch/>
        </>
    )
}

export default ImportTest
