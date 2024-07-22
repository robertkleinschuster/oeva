import React, {useEffect, useState} from "react";
import {listRootDirectory} from "../fs/StorageManager.ts";
import {IonItem, IonLabel, IonList} from "@ionic/react";

const StorageDirectory: React.FC = () => {
    const [files, setFiles] = useState<Map<string, File>>(new Map)

    useEffect(() => {
        listRootDirectory().then(setFiles)
        const interval = setInterval(() => {
            listRootDirectory().then(setFiles)
        }, 1000)
        return () => clearInterval(interval)
    }, []);



    return <IonList inset >
        {Array.from(files.entries()).map(([filename, file]) => <IonItem key={filename}>
            <IonLabel>{filename} ({file.size} bytes)</IonLabel>
        </IonItem>)}
    </IonList>
}

export default StorageDirectory