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
    useIonLoading,
} from '@ionic/react';
import React, {useRef, useState} from "react";
import FeedForm from "../components/FeedForm";
import {feedDb} from "../db/FeedDb";
import {TransitFeedStatus} from "../db/Feed";
import {FeedImporter} from "../import/FeedImporter";
import {GTFSDB} from "../db/GTFSDB";
import {scheduleDB} from "../db/ScheduleDB";
import axios from "axios";

const AddFeed: React.FC<{ trigger: string }> = ({trigger}) => {
    const [presentLoading, dismissLoading] = useIonLoading();
    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [file, setFile] = useState<File>()
    const [keywords, setKeywords] = useState<string | undefined>('')
    const [startImport, setStartImport] = useState(true)

    const modal = useRef<HTMLIonModalElement>(null)

    const save = async () => {
        const feedId = await feedDb.transit.add({
            name,
            url,
            keywords,
            status: startImport ? TransitFeedStatus.DOWNLOADING : TransitFeedStatus.DRAFT
        })
        if (file) {
            const importer = new FeedImporter(feedDb, new GTFSDB(feedId), scheduleDB, axios);
            await importer.saveData(feedId, file)
            await importer.updateStatus(feedId, TransitFeedStatus.SAVING)
        }
    }

    const validate = () => {
        return name.length && (url.length || file);
    }

    const onChange = async (name: string, url: string, keywords: string, file?: File) => {
        setName(name)
        setURL(url)
        setKeywords(keywords)
        setFile(file)
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
                            onClick={async () => {
                                if (validate()) {
                                    await presentLoading('Wird gespeichert...')
                                    await save()
                                    await dismissLoading()
                                    modal.current?.dismiss()
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
