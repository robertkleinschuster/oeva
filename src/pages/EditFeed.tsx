import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonList,
    IonPage,
    IonTitle,
    IonToolbar,
    isPlatform,
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import FeedForm from "../components/FeedForm";
import {feedDb} from "../db/FeedDb";
import {RouteComponentProps} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {TransitFeedStatus} from "../db/Feed";

interface EditFeedPageProps extends RouteComponentProps<{
    id: string
}> {
}

const EditFeed: React.FC<EditFeedPageProps> = ({match}) => {
    const feed = useLiveQuery(() => feedDb.transit.get(Number.parseInt(match.params.id)))

    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [ifopt, setIFOPT] = useState(false)

    useEffect(() => {
        if (feed) {
            setName(feed.name)
            setURL(feed.url)
            setIFOPT(feed.is_ifopt)
            console.log(feed)
        }
    }, [feed]);

    const save = async () => {
        await feedDb.transit.update(feed!, {
            name,
            url,
            is_ifopt: ifopt,
            status: TransitFeedStatus.DRAFT
        })
    }

    const deleteFeed = async () => {
        await feedDb.transit.delete(feed!.id!)
    }

    const importFeed = async () => {
        await feedDb.transit.update(feed!, {
            status: TransitFeedStatus.DOWNLOADING
        })
    }


    const validate = () => {
        return name.length && url.length;
    }

    const onChange = async (name: string, url: string, ifopt: boolean) => {
        setName(name)
        setURL(url)
        setIFOPT(ifopt)
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "Feeds" : undefined}/>
                    </IonButtons>
                    <IonTitle>Feed bearbeiten</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            onClick={(e) => {
                                if (validate()) {
                                    void save()
                                } else {
                                    e.preventDefault()
                                }
                            }}
                            routerLink="/feeds"
                            routerDirection="back"
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
                                   onClick={deleteFeed}
                                   routerLink="/feeds"
                                   routerDirection="back">
                            Feed entfernen
                        </IonButton>
                        <IonButton color="primary"
                                   onClick={importFeed}
                                   routerLink="/feeds"
                                   routerDirection="back">
                            Feed importieren
                        </IonButton>
                    </IonItem>
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default EditFeed;
