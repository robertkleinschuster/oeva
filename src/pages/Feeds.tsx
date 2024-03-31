import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader, IonItem, IonLabel, IonList, IonNote,
    IonPage, IonText,
    IonTitle,
    IonToolbar, isPlatform, useIonModal
} from '@ionic/react';
import React from "react";
import {StorageQuota} from "../components/StorageQuota";
import {useLiveQuery} from "dexie-react-hooks";
import {feedDb} from "../db/FeedDb";
import FeedStatus from "../components/FeedStatus";
import AddFeed from "../modals/AddFeed";
import EditFeed from "../modals/EditFeed";

const Feeds: React.FC = () => {
    const feeds = useLiveQuery(() => feedDb.transit.toArray())

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>Feeds</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <StorageQuota/>
                <IonList>
                    {feeds?.map(feed => <IonItem
                        button
                        id={'edit-feed-' + feed.id}
                        key={feed.id}>
                        <EditFeed feedId={feed.id!} trigger={'edit-feed-' + feed.id}/>
                        <IonLabel>
                            <IonText style={{display: 'block'}}>
                                {feed.name}
                            </IonText>
                            <IonNote color="medium"><FeedStatus feed={feed}/></IonNote>
                        </IonLabel>
                    </IonItem>)}
                    <IonItem id="add-feed" button>
                        <AddFeed trigger="add-feed"/>
                        <IonLabel>Feed hinzufügen</IonLabel>
                    </IonItem>
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Feeds;
