import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSearchbar,
    IonTitle,
    IonToolbar, isPlatform
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {scheduleDB} from "../db/ScheduleDB";
import {Station} from "../db/Schedule";
import Tokenizer from "wink-tokenizer";
import Fuse from "fuse.js";

const StationSearch: React.FC = () => {
    const [keyword, setKeyword] = useState('')
    const [stations, setStations] = useState<Station[]>([])

    useEffect(() => {
        setStations([])
        if (keyword.length > 1) {
            const tokenizer = new Tokenizer
            const keywords = tokenizer.tokenize(keyword).map(token => token.value)
            scheduleDB.station
                .where('keywords')
                .startsWithAnyOfIgnoreCase(keywords)
                .toArray(stations => {
                    const fuse = new Fuse(stations, {
                        keys: ['name'],
                        threshold: 0.3
                    })
                    setStations(fuse.search(keyword).map(result => result.item))
                })
        }
    }, [keyword]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>Stationen</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <form action="#" onSubmit={e => e.preventDefault()}>
                    <IonSearchbar
                        value={keyword}
                        debounce={500}
                        placeholder="Station Suchen"
                        inputmode="search"
                        onIonInput={e => setKeyword(String(e.detail.value))}
                    />
                </form>
                <IonList>
                    {stations.map(station => <IonItem
                            routerLink={`/stations/${station.id}`}
                            key={station.id}>
                            <IonLabel>{station.name}</IonLabel>
                        </IonItem>
                    )}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default StationSearch;
