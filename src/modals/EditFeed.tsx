import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonList,
    IonModal,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import React, {useEffect, useRef, useState} from "react";
import FeedForm from "../components/FeedForm";
import {feedDb} from "../db/FeedDb";
import {useLiveQuery} from "dexie-react-hooks";
import {stoppedStatuses, TransitFeedStatus} from "../db/Feed";


const EditFeed: React.FC<{ feedId: number, trigger: string }> = ({feedId, trigger}) => {
    const feed = useLiveQuery(() => feedDb.transit.get(feedId), [feedId])

    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [ifopt, setIFOPT] = useState(false)

    const modal = useRef<HTMLIonModalElement>(null)

    useEffect(() => {
        if (feed) {
            setName(feed.name)
            setURL(feed.url)
            setIFOPT(feed.is_ifopt)
        }
    }, [feed]);

    const saveFeed = async () => {
        await feedDb.transit.update(feed!, {
            name,
            url,
            is_ifopt: ifopt
        })
    }

    const deleteFeed = async () => {
        await modal.current?.dismiss()
        await feedDb.transit.delete(feed!.id!)
    }

    const importFeed = async () => {
        await saveFeed()
        await feedDb.transit.update(feed!, {
            status: TransitFeedStatus.DOWNLOADING
        })
        modal.current?.dismiss()
    }
    const processFeed = async () => {
        await saveFeed()
        await feedDb.transit.update(feed!, {
            status: TransitFeedStatus.PROCESSING
        })
        modal.current?.dismiss()
    }

    const continueFeed = async () => {
        if (feed!.previous_status) {
            await saveFeed()
            await feedDb.transit.update(feed!, {
                status: feed!.previous_status
            })
            modal.current?.dismiss()
        }
    }

    const resetFeed = async () => {
        await saveFeed()
        await feedDb.transit.update(feed!, {
            progress: undefined,
            step: undefined,
            offset: undefined
        })
        modal.current?.dismiss()
        window.location.reload()
    }

    const abortFeed = async () => {
        await saveFeed()
        await feedDb.transit.update(feed!, {
            status: TransitFeedStatus.ABORTED,
            previous_status: feed!.status
        })
        modal.current?.dismiss()
        window.location.reload()
    }

    const validateFeed = () => {
        return Boolean(name.length && url.length);
    }

    const onChange = async (name: string, url: string, ifopt: boolean) => {
        setName(name)
        setURL(url)
        setIFOPT(ifopt)
    }

    return (
        <IonModal ref={modal} trigger={trigger}>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => modal.current?.dismiss()}>Abbrechen</IonButton>
                    </IonButtons>
                    <IonTitle>Feed bearbeiten</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            onClick={() => {
                                if (validateFeed()) {
                                    void saveFeed()
                                    modal.current?.dismiss()
                                }
                            }}
                        >
                            Speichern
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <FeedForm onChange={onChange} name={name} url={url} ifopt={ifopt}/>
                <IonList>
                    <IonItem>
                        <IonButton color="danger"
                                   onClick={deleteFeed}>
                            Feed entfernen
                        </IonButton>
                        <IonButton color="primary"
                                   onClick={importFeed}>
                            Importieren
                        </IonButton>
                        <IonButton color="primary"
                                   onClick={processFeed}>
                            Verarbeiten
                        </IonButton>
                        <IonButton color="warning"
                                   onClick={resetFeed}>
                            Zurücksetzen
                        </IonButton>
                        {feed?.status && stoppedStatuses.includes(feed?.status)
                        && feed.status !== TransitFeedStatus.DONE
                        && feed?.previous_status && !stoppedStatuses.includes(feed.previous_status) ?
                            <IonButton color="primary"
                                       onClick={continueFeed}>
                                Fortsetzen
                            </IonButton> : null}
                        {feed?.status && !stoppedStatuses.includes(feed?.status) ?
                            <IonButton color="warning"
                                       onClick={abortFeed}>
                                Abbrechen
                            </IonButton> : null}
                    </IonItem>
                </IonList>
            </IonContent>
        </IonModal>
    );
};

export default EditFeed;
