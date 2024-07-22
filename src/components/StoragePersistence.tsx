import React, {useEffect, useState} from "react";
import {isStoragePersisted, persist, PersistenceState} from "../fs/StorageManager.ts";
import {IonButton, IonIcon, IonItem, IonLabel, IonList} from "@ionic/react";
import {checkmark, warning} from "ionicons/icons";

const StoragePersistence: React.FC = () => {
    const [persistenceState, setPersistenceState] = useState<PersistenceState>(PersistenceState.UNSUPPORTED)

    useEffect(() => {
        isStoragePersisted().then(enabled => {
            if (enabled) {
                setPersistenceState(PersistenceState.ENABLED)
            } else {
                setPersistenceState(PersistenceState.PROMPT)
            }
        })
    }, []);

    const onEnablePersistence = () => {
        persist().then(enabled => {
            if (enabled) {
                setPersistenceState(PersistenceState.ENABLED)
            } else {
                setPersistenceState(PersistenceState.UNSUPPORTED)
            }
        })
    }

    return <IonList inset>
        <IonItem>
            <IonLabel>Persistenter Speicher</IonLabel>
            {persistenceState === PersistenceState.ENABLED ? <IonIcon icon={checkmark}/> : null}
            {persistenceState === PersistenceState.UNSUPPORTED ? <IonIcon icon={warning}/> : null}
            {persistenceState === PersistenceState.PROMPT ?
                <IonButton onClick={onEnablePersistence}>Aktivieren</IonButton> : null}
        </IonItem>
    </IonList>
}

export default StoragePersistence