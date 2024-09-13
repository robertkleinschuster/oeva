import React, {useEffect, useState} from "react";
import {listRootDirectory} from "../fs/StorageManager.ts";
import {IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList} from "@ionic/react";
import {getDirectoryHandle} from "../../shared/messages";

const StorageDirectory: React.FC = () => {
    const [files, setFiles] = useState<Map<string, File>>(new Map)

    useEffect(() => {
        listRootDirectory().then(setFiles)
        const interval = setInterval(() => {
            listRootDirectory().then(setFiles)
        }, 1000)
        return () => clearInterval(interval)
    }, []);


    return <IonList inset>
        {Array.from(files.entries()).map(([filename, file]) => <IonItemSliding key={filename}>
            <IonItem>
                <IonLabel>{filename} ({file.size.toLocaleString()} bytes)</IonLabel>
            </IonItem>
            <IonItemOptions>
                <IonItemOption color="danger" onClick={() => {
                    const directoryName = filename.substring(0, filename.lastIndexOf('/'));
                    getDirectoryHandle(directoryName).then(directoryHandle =>
                        void directoryHandle.removeEntry(file.name)
                    )
                }}>Löschen</IonItemOption>
            </IonItemOptions>
        </IonItemSliding>)}
    </IonList>
}

export default StorageDirectory