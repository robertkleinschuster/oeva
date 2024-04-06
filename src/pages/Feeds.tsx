import {
    IonAlert,
    IonBackButton, IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar, isPlatform, useIonLoading
} from '@ionic/react';
import React, {useContext} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {feedDb} from "../db/FeedDb";
import FeedStatus from "../components/FeedStatus";
import AddFeed from "../modals/AddFeed";
import EditFeed from "../modals/EditFeed";
import {RunnerContext} from "../RunnerContext";
import {scheduleDB} from "../db/ScheduleDB";

const Feeds: React.FC = () => {
    const feeds = useLiveQuery(() => feedDb.transit.toArray())
    const runningFeed = useContext(RunnerContext)
    const [present, dismiss] = useIonLoading();

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>Feeds</IonTitle>
                    <IonButtons slot="end">
                        <IonButton id="delete-schedule">
                            Daten löschen
                        </IonButton>
                        <IonAlert
                            header="Fahrplandaten löschen?"
                            trigger="delete-schedule"
                            buttons={[
                                {
                                    text: 'Abbrechen',
                                    role: 'cancel',
                                },
                                {
                                    text: 'Löschen',
                                    role: 'destructive',
                                    handler: async () => {
                                        await present('Löschen...')
                                        await scheduleDB.delete()
                                        await dismiss()
                                    },
                                },
                            ]}
                            onDidDismiss={({ detail }) => console.log(`Dismissed with role: ${detail.role}`)}
                        ></IonAlert>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    {feeds?.map(feed => <IonItem
                        button
                        detail={false}
                        id={'edit-feed-' + feed.id}
                        key={feed.id}>
                        <EditFeed feedId={feed.id!} trigger={'edit-feed-' + feed.id}/>
                        <IonLabel>
                            <IonText style={{display: 'block'}}>
                                {feed.name}
                            </IonText>
                            <IonNote color="medium"><FeedStatus feed={feed}/></IonNote>
                        </IonLabel>
                        {runningFeed === feed.id ? <IonSpinner/> : null}
                    </IonItem>)}
                    <IonItem id="add-feed" button detail={false}>
                        <AddFeed trigger="add-feed"/>
                        <IonLabel>Feed hinzufügen</IonLabel>
                    </IonItem>
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Feeds;
