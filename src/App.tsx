import './App.css'
import {useRegisterSW} from "virtual:pwa-register/react";
import StationSearch from "./StationSearch.tsx";
import {useState} from "react";
import {db} from './GTFSDB';
import axios, {AxiosProgressEvent} from "axios";
import {runImport, prepareImport} from "./import.ts";

function App() {
    const [importingData, setImportingData] = useState<boolean>(false)
    const [downloadingData, setDownloadingData] = useState<boolean>(false)
    const [importFinished, setImportFinished] = useState<boolean>(false)
    const [updateProgress, setUpdateProgress] = useState<number>(0)
    const [currentFilename, setCurrentFilename] = useState<string|null>(null)
    const [downloadStats, setDownloadStats] = useState<AxiosProgressEvent | null>(null)

    const updateData = (importId: number) => {
        setImportingData(true)

        db.import.get(importId)
            .then(async currentImport => {
                if (currentImport?.files) {
                    await runImport(importId, (progress, filename) => {
                        setUpdateProgress(progress);
                        setCurrentFilename(filename)
                    })
                    setImportFinished(true)
                } else {
                    setDownloadingData(true)
                    axios.get("https://static.oebb.at/open-data/soll-fahrplan-gtfs/GTFS_OP_2024_obb.zip",
                        {
                            responseType: 'blob',
                            onDownloadProgress: (progressEvent) => {
                                setDownloadStats(progressEvent)
                            }
                        })
                        .then(async response => {
                            await prepareImport(importId, response.data)
                            setDownloadingData(false)
                            await runImport(importId, (progress, filename) => {
                                setUpdateProgress(progress);
                                setCurrentFilename(filename)
                            })
                            setImportFinished(true)
                        })
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
            const importId = await db.import.add({
                name: 'oebb',
                files: null,
                imported: null,
                done: 0,
                timestamp: (new Date()).getTime()
            })
            updateData(importId)
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
                <p>Downloading
                    data: {Math.round((downloadStats?.loaded ?? 0) / 1000000)} / {Math.round((downloadStats?.total ?? 0) / 1000000)} MB</p> : null}
            {importingData ? importFinished ? <p>Import abgeschlossen</p> : <p>Importing data: {updateProgress} % {currentFilename ? <>({currentFilename})</> : null}</p> :
                <StationSearch/>}
        </>
    )
}

export default App
