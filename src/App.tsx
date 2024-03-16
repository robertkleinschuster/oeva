import './App.css'
import {useRegisterSW} from "virtual:pwa-register/react";
import StationSearch from "./StationSearch.tsx";
import {useState} from "react";
import {db} from './GTFSDB';
import {AxiosProgressEvent} from "axios";
import {runImport, createImport, downloadData} from "./import.ts";

function App() {
    const [importingData, setImportingData] = useState<boolean>(false)
    const [downloadingData, setDownloadingData] = useState<boolean>(false)
    const [importFinished, setImportFinished] = useState<boolean>(false)
    const [updateMessage, setUpdateMessage] = useState<string>('')
    const [currentFilename, setCurrentFilename] = useState<string | null>(null)
    const [downloadStats, setDownloadStats] = useState<AxiosProgressEvent | null>(null)

    const updateData = (importId: number) => {
        setImportingData(true)

        db.import.get(importId)
            .then(async currentImport => {
                if (currentImport?.files) {
                    await runImport(importId, (finished, open, filename) => {
                        setUpdateMessage(`${finished} / ${open}`);
                        setCurrentFilename(filename)
                    })
                    setImportFinished(true)
                } else {
                    setDownloadingData(true)
                    await downloadData(importId, setDownloadStats)
                    setDownloadingData(false)
                    await runImport(importId, (finished, open, filename) => {
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
            updateData(await createImport(
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
                    <button onClick={handleRefresh}>Refresh</button>
                </div>
            )}
            {!downloadingData && !importingData ?
                <div>
                    <button onClick={handleUpdate}>Update data</button>
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

export default App
