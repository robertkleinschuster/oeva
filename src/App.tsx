import './App.css'
import {useRegisterSW} from "virtual:pwa-register/react";
import StationSearch from "./StationSearch.tsx";
import {useState} from "react";
import {db} from './GTFSDB';
import axios, {AxiosProgressEvent} from "axios";
import {importGTFSZip} from "./import.ts";

function App() {
    const [updatingData, setUpdatingData] = useState<boolean>(false)
    const [downloadingData, setDownloadingData] = useState<boolean>(false)
    const [updateProgress, setUpdateProgress] = useState<number>(0)
    const [downloadStats, setDownloadStats] = useState<AxiosProgressEvent | null>(null)

    const updateData = (importId: number) => {
        setUpdatingData(true)

        db.import.get(importId).then(currentImport => {
            if (currentImport) {
                if (currentImport.data) {
                    importData(importId, currentImport.data)
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
                            await db.import.update(importId, {
                                done: 0,
                                data: response.data
                            })
                            setDownloadingData(false)
                            importData(importId, response.data)
                        })
                }
            }
        })
    }

    const importData = async (importId: number, data: Blob) => {
        await importGTFSZip(data, (progress) => {
            setUpdateProgress(progress);
        })
        setUpdatingData(false)
        db.import.update(importId, {
            done: 1,
            data: null
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
                current_file: null,
                done: 0,
                timestamp: (new Date()).getTime(),
                data: null
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
            {!downloadingData && !updatingData ?
                <div>
                    <button onClick={handleUpdate}>Update data</button>
                </div>
                : null}
            {downloadingData ?
                <p>Downloading
                    data: {Math.round((downloadStats?.loaded ?? 0) / 1000000)} / {Math.round((downloadStats?.total ?? 0) / 1000000)} MB</p> : null}
            {updatingData ? <p>Saving data: {updateProgress} %</p> :
                <StationSearch/>}
        </>
    )
}

export default App
