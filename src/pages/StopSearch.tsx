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
import {searchStop} from "../transit/StopSearch";

const StopSearch: React.FC = () => {
        const [keyword, setKeyword] = useState('')

        const stops = useLiveQuery(async () => {
                if (keyword.length > 1) {
                    return searchStop(keyword)
                }
                return Promise.resolve([])
            }, [keyword]
        )

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
    }
;

export default StopSearch;
