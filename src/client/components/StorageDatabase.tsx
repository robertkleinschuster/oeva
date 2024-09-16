import React from "react";
import {IonButton, IonItem, IonLabel, IonList} from "@ionic/react";
import {migrator} from "../db/migrator";

const StorageDatabase: React.FC = () => {

    const onInitDatabase = () => {
        migrator.migrateToLatest().catch(console.error)
    }

    return <IonList inset>
        <IonItem>
            <IonLabel>Datenbank</IonLabel>
            <IonButton onClick={onInitDatabase}>Initialisieren</IonButton>
        </IonItem>
    </IonList>
}

export default StorageDatabase