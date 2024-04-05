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
import {Stop} from "../db/Schedule";
import Tokenizer from "wink-tokenizer";
import Fuse from "fuse.js";

const StopSearch: React.FC = () => {
    const [keyword, setKeyword] = useState('')
    const [stops, setStops] = useState<Stop[]>([])

    useEffect(() => {
        setStops([])
        if (keyword.length > 1) {
            const tokenizer = new Tokenizer
            const keywords = tokenizer.tokenize(keyword).map(token => token.value)
            scheduleDB.stop
                .where('keywords')
                .anyOfIgnoreCase(keywords)
                .toArray(stations => {
                    const fuse = new Fuse(stations, {
                        keys: ['name'],
                        threshold: 0.3
                    })
                    setStops(fuse.search(keyword).map(result => result.item))
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
                    <IonTitle>Haltepunkte</IonTitle>
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
                    {stops.map(stop => <IonItem
                            routerLink={`/stops/${stop.id}`}
                            key={stop.id}>
                            <IonLabel>{stop.name}</IonLabel>
                        </IonItem>
                    )}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default StopSearch;
