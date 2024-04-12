import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonProgressBar,
    IonSearchbar,
    IonTitle,
    IonToolbar, isPlatform
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {isTripActiveOn} from "../transit/Schedule";
import {scheduleDB} from "../db/ScheduleDB";

const TripSearch: React.FC = () => {
        const [keyword, setKeyword] = useState('')
        const [loading, setLoading] = useState(false)

        const trips = useLiveQuery(async () => {
                if (keyword.length > 1) {
                    return scheduleDB.trip
                        .where('number')
                        .equals(keyword)
                        .filter(trip => isTripActiveOn(trip, new Date()))
                        .toArray();
                }
                return Promise.resolve(undefined)
            }, [keyword]
        )

        useEffect(() => {
            setLoading(false)
        }, [trips]);

        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                        </IonButtons>
                        <IonTitle>Züge</IonTitle>
                        {loading ? <IonProgressBar type="indeterminate"></IonProgressBar> : null}
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <form action="#" onSubmit={e => e.preventDefault()}>
                        <IonSearchbar
                            debounce={500}
                            placeholder="Zugnummer"
                            inputmode="search"
                            onIonInput={e => {
                                setLoading(true)
                                setKeyword(String(e.detail.value))
                            }}
                        />
                    </form>
                    <IonList>
                        {trips?.map(trip => <IonItem
                                routerLink={`/trips/${trip.id}`}
                                key={trip.id}>
                                <IonLabel>
                                    {trip.name} {trip.direction} <IonNote>({trip.feed_name})</IonNote>
                                </IonLabel>
                            </IonItem>
                        )}
                    </IonList>
                </IonContent>
            </IonPage>
        );
    }
;

export default TripSearch;
