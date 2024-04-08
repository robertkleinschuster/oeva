import {
    IonButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonItem,
    IonList,
    IonModal,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import React, {useRef, useState} from "react";
import FeedForm from "../components/FeedForm";
import {feedDb} from "../db/FeedDb";
import {TransitFeedStatus} from "../db/Feed";

const AddFeed: React.FC<{ trigger: string }> = ({trigger}) => {
    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [keywords, setKeywords] = useState<string|undefined>('')
    const [startImport, setStartImport] = useState(true)

    const modal = useRef<HTMLIonModalElement>(null)

    const save = async () => {
        await feedDb.transit.add({
            name,
            url,
            keywords,
            status: startImport ? TransitFeedStatus.DOWNLOADING : TransitFeedStatus.DRAFT
        })
        modal.current?.dismiss()
    }

    const validate = () => {
        return name.length && url.length;
    }

    const onChange = async (name: string, url: string, keywords: string) => {
        setName(name)
        setURL(url)
        setKeywords(keywords)
    }

    return (
        <IonModal ref={modal} trigger={trigger}>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => modal.current?.dismiss()}>Abbrechen</IonButton>
                    </IonButtons>
                    <IonTitle>Feed hinzufügen</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            onClick={() => {
                                if (validate()) {
                                    void save()
                                }
                            }}
                        >Hinzufügen</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <FeedForm onChange={onChange}/>
                <IonList>
                    <IonItem>
                        <IonCheckbox
                            checked={startImport}
                            onIonChange={() => setStartImport(!startImport)}
                        >
                            Import direkt starten
                        </IonCheckbox>
                    </IonItem>
                </IonList>
            </IonContent>
        </IonModal>
    );
};

export default AddFeed;
