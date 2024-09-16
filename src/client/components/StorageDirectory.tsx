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
            <IonItem onClick={async () => {
                const fileContent = await file.arrayBuffer();

                // Create a Blob from the file content
                const blob = new Blob([fileContent]);

                // Create a URL for the Blob
                const url = URL.createObjectURL(blob);

                // Create an anchor element and set the download attribute
                const a = document.createElement('a');
                a.href = url;
                a.download = filename; // Set the filename for the download

                // Append the anchor to the body (it won't be visible)
                document.body.appendChild(a);

                // Programmatically click the anchor to trigger the download
                a.click();

                // Remove the anchor element from the document
                document.body.removeChild(a);

                // Revoke the object URL to free up memory
                URL.revokeObjectURL(url);
            }}>
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