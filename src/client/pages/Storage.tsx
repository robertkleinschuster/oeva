import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    isPlatform
} from '@ionic/react';
import React from "react";
import {StorageQuota} from "../components/StorageQuota";
import StorageDirectory from "../components/StorageDirectory.tsx";
import StoragePersistence from "../components/StoragePersistence.tsx";
import StorageDatabase from "../components/StorageDatabase";

const Storage: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>Speicher</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <StorageQuota/>
                <StoragePersistence/>
                <StorageDatabase/>
                <StorageDirectory/>
            </IonContent>
        </IonPage>
    );
};

export default Storage;
