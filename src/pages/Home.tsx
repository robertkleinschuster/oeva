import {
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import React from "react";

const Home: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>OeVA</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle size="large">OeVA</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonList>
                    <IonItem routerLink="/stops">
                        <IonLabel>Stationen</IonLabel>
                    </IonItem>
                    <IonItem routerLink="/trips">
                        <IonLabel>Züge</IonLabel>
                    </IonItem>
                    <IonItem routerLink="/feeds">
                        <IonLabel>Feeds</IonLabel>
                    </IonItem>
                    <IonItem routerLink="/storage">
                        <IonLabel>Speicher</IonLabel>
                    </IonItem>
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Home;
