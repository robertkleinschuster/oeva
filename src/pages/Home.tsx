import {
    IonButton, IonCard, IonCardContent,
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
import {useRegisterSW} from "virtual:pwa-register/react";

const Home: React.FC = () => {
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        async onRegisteredSW(r: string) {
            console.log('SW Registered: ', r);
        },
        onRegisterError(error: any) {
            console.error('SW Registration Error: ', error);
        },
    });

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
                {needRefresh ?
                    <IonCard>
                        <IonCardContent>
                            <p>Es ist eine neue Version von OeVA Beta verfügbar!</p>
                            <IonButton onClick={() => {
                                void updateServiceWorker(true)
                            }}>Jetzt aktualisieren
                            </IonButton>
                        </IonCardContent>
                    </IonCard> : null}
                <IonList>
                    <IonItem routerLink="/stations">
                        <IonLabel>Stationen</IonLabel>
                    </IonItem>
                    <IonItem routerLink="/feeds">
                        <IonLabel>Feeds</IonLabel>
                    </IonItem>
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Home;
