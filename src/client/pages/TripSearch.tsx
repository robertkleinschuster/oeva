import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonItemDivider,
    IonItemGroup,
    IonLabel,
    IonList,
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
import TripName from "../components/TripName";

const TripSearch: React.FC = () => {
        const [keyword, setKeyword] = useState('')
        const [loading, setLoading] = useState(false)

        const trips = useLiveQuery(async () => {
                if (keyword.length > 1) {
                    return scheduleDB.trip
                        .where('number')
                        .equals(keyword)
                        .toArray();
                }
                return Promise.resolve(undefined)
            }, [keyword]
        )

        useEffect(() => {
            setLoading(false)
        }, [trips]);

        const tripsToday = trips?.filter(trip => isTripActiveOn(trip, new Date()));
        const tripsOnOtherDays = trips?.filter(trip => !isTripActiveOn(trip, new Date()));

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
                        {tripsToday?.length ?
                            <IonItemGroup>
                                <IonItemDivider color="primary">
                                    Verkehrt heute
                                </IonItemDivider>
                                {tripsToday.map(trip => <IonItem
                                        routerLink={`/trips/${trip.id}`}
                                        key={trip.id}>
                                        <IonLabel>
                                            <TripName trip={trip}/>
                                        </IonLabel>
                                    </IonItem>
                                )}
                            </IonItemGroup> : null}
                        {tripsOnOtherDays?.length ?
                            <IonItemGroup>
                                <IonItemDivider color="warning">
                                    Verkehrt an anderen Tagen
                                </IonItemDivider>
                                {tripsOnOtherDays.map(trip => <IonItem
                                        routerLink={`/trips/${trip.id}`}
                                        key={trip.id}>
                                        <IonLabel>
                                            <TripName trip={trip}/>
                                        </IonLabel>
                                    </IonItem>
                                )}
                            </IonItemGroup> : null}
                    </IonList>
                </IonContent>
            </IonPage>
        );
    }
;

export default TripSearch;
