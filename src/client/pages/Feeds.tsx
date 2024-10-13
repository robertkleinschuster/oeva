import {
    IonAlert,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
    isPlatform,
    useIonLoading
} from '@ionic/react';
import React, {useContext} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {feedDb} from "../../shared/db/FeedDb";
import AddFeed from "../modals/AddFeed";
import EditFeed from "../modals/EditFeed";
import {RunnerContext} from "../RunnerContext";
import {stoppedStatuses, TransitFeedStatus} from "../../shared/db/Feed";
import FeedStatus from "../components/FeedStatus";

const Feeds: React.FC = () => {
    const feeds = useLiveQuery(() => feedDb.transit.toArray())
    const [runningFeed, progress] = useContext(RunnerContext)
    const [presentLoading, dismissLoading] = useIonLoading()
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>Feeds</IonTitle>
                    <IonButtons slot="end">
                        <IonButton id="update">
                            Aktualisieren
                        </IonButton>
                        <IonAlert
                            header="Daten aktualisieren?"
                            trigger="update"
                            buttons={[
                                {
                                    text: 'Abbrechen',
                                    role: 'cancel',
                                },
                                {
                                    text: 'Aktualisieren',
                                    handler: async () => {
                                        await presentLoading('Aktualisieren...')
                                        await feedDb.transit
                                            .where('status')
                                            .anyOf(stoppedStatuses)
                                            .modify(feed => {
                                                if (feed.url) {
                                                    feed.status = TransitFeedStatus.DOWNLOADING
                                                }
                                            })
                                        await dismissLoading()
                                    },
                                },
                            ]}
                        ></IonAlert>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    {feeds?.map(feed => <IonItemSliding key={feed.id}>
                        <IonItem
                            button
                            detail={false}
                            id={'edit-feed-' + feed.id}>
                            <EditFeed feedId={feed.id!} trigger={'edit-feed-' + feed.id}/>
                            <IonLabel>
                                <IonText style={{display: 'block'}}>
                                    {feed.name}
                                </IonText>
                                <IonNote color="medium"><FeedStatus feed={feed}/>{runningFeed === feed.id ? <>: {progress}</> : null}</IonNote>
                            </IonLabel>
                            {runningFeed === feed.id ? <IonSpinner/> : null}
                        </IonItem>
                        <IonItemOptions>
                            {stoppedStatuses.includes(feed.status) ?
                                <IonItemOption onClick={() => {
                                    feedDb.transit.update(feed!, {
                                        status: TransitFeedStatus.IMPORTING
                                    })
                                }}>Importieren</IonItemOption>
                                : <IonItemOption color="warning" onClick={() => {
                                    feedDb.transit.update(feed!, {
                                        status: TransitFeedStatus.ABORTED
                                    })
                                    window.location.reload()
                                }}>Abbrechen</IonItemOption>}
                        </IonItemOptions>
                    </IonItemSliding>)}
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
