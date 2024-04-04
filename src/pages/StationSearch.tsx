import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader, IonItem, IonLabel, IonList,
    IonPage, IonSearchbar,
    IonTitle,
    IonToolbar, isPlatform
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {scheduleDB} from "../db/ScheduleDB";
import lunr from "lunr";
import {Station} from "../db/Schedule";

const StationSearch: React.FC = () => {
    const [keyword, setKeyword] = useState('')
    const [stations, setStations] = useState<Station[]>([])

    useEffect(() => {
        setStations([])
        if (keyword.length > 1) {
            const keywords = lunr.tokenizer(keyword).map(String)
            scheduleDB.station
                .where('keywords')
                .startsWithAnyOf(keywords)
                .toArray(stations => {
                    const map = new Map<string, Station>
                    for (const station of stations) {
                        map.set(station.id, station)
                    }
                    setStations(Array.from(map.values()).sort((a, b) => {
                        if (a.name.toLowerCase() === keyword.toLowerCase()) {
                            return -1;
                        }
                        if (b.name.toLowerCase() === keyword.toLowerCase()) {
                            return 1;
                        }
                        const aMatches = a.keywords.filter(k => keywords.filter(k2 => k.startsWith(k2)).length).length
                        const bMatches = b.keywords.filter(k => keywords.filter(k2 => k.startsWith(k2)).length).length
                        return bMatches - aMatches
                    }))
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
