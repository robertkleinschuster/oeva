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

const StopSearch: React.FC = () => {
    const [keyword, setKeyword] = useState('')

    const stops = useLiveQuery(async () => {
        if (keyword.length > 1) {
            const tokenizer = new Tokenizer
            const keywords = tokenizer.tokenize(keyword).map(token => token.value)
            if (keywords.length === 1) {
                const count = await scheduleDB.stop
                    .where('keywords')
                    .anyOfIgnoreCase(keywords).count()
                if (count > 500) {
                    return Promise.resolve([])
                }
            }
            return scheduleDB.stop
                .where('keywords')
                .startsWithAnyOfIgnoreCase(keywords)
                .distinct()
                .toArray(stops => {
                    const fuse = new Fuse(
                        stops,
                        {
                            keys: ['name'],
                            threshold: 0.4,
                            useExtendedSearch: true,
                        }
                    )
                    return fuse.search(keyword).map(result => result.item)
                })
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
