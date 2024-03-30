import {
    IonBackButton, IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    isPlatform,
} from '@ionic/react';
import React, {useState} from "react";
import FeedForm from "../components/FeedForm";
import {feedDb} from "../db/FeedDb";

const AddFeed: React.FC = () => {
    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [ifopt, setIFOPT] = useState(false)

    const save = async () => {
        await feedDb.transit.add({
            name,
            url,
            is_ifopt: ifopt
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
                    <IonTitle>Feed hinzufügen</IonTitle>
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
                        >Hinzufügen</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <FeedForm onChange={onChange}/>
            </IonContent>
        </IonPage>
    );
};

export default AddFeed;
