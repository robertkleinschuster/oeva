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
import Tokenizer from "wink-tokenizer";
import Fuse from "fuse.js";
import {useLiveQuery} from "dexie-react-hooks";
import {transliterate} from "transliteration";

const StopSearch: React.FC = () => {
    const [keyword, setKeyword] = useState('')

    const stops = useLiveQuery(async () => {
        if (keyword.length > 1) {
            const tokenizer = new Tokenizer
            const keywords = tokenizer.tokenize(keyword).map(token => token.value)
            const transliterations = keywords.map(token => transliterate(token))
            keywords.push(...transliterations)
            keywords.push(keyword)
            keywords.push(transliterate(keyword))

            const stops = [];
            for (const keyword of keywords) {
                stops.push(...await scheduleDB.stop
                    .where('keywords')
                    .startsWithIgnoreCase(keyword)
                    .distinct()
                    .toArray()
                )
            }

            const stopMap = new Map(stops.map(stop => [stop.id, stop]))

            if (keywords.length === 1 && stopMap.size > 500) {
                return Promise.resolve([])
            }

            const fuse = new Fuse(
                Array.from(stopMap.values()),
                {
                    keys: ['name', 'keywords'],
                    threshold: 0.4,
                    useExtendedSearch: true,
                }
            )
            return fuse.search(transliterate(keyword)).map(result => result.item)
        }
        return Promise.resolve([])
    }, [keyword])

    useEffect(() => {

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
                        debounce={500}
                        placeholder="Haltepunkt Suchen"
                        inputmode="search"
                        onIonInput={e => setKeyword(String(e.detail.value))}
                    />
                </form>
                <IonList>
                    {stops?.map(stop => <IonItem
                            routerLink={`/stops/${stop.id}`}
                            key={stop.id}>
                            <IonLabel>{stop.name}{stop.platform ? <>: Steig {stop.platform}</> : null}</IonLabel>
                        </IonItem>
                    )}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default StopSearch;
