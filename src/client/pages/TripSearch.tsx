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
import TripName from "../components/TripName";
import {Trip} from "../db/schema";
import {db} from "../db/client";

const TripSearch: React.FC = () => {
        const [keyword, setKeyword] = useState('')
        const [loading, setLoading] = useState(false)
        const [trips, setTrips] = useState<Trip[]>([])
        useEffect(() => {
            if (keyword.length) {
                db.selectFrom('trip')
                    .selectAll()
                    .where('number', '=', keyword)
                    .execute()
                    .then(setTrips)
            } else {
                setTrips([])
            }
        }, [keyword]);

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
                        {trips?.length ?
                            <IonItemGroup>
                                <IonItemDivider color="primary">
                                    Verkehrt heute
                                </IonItemDivider>
                                {trips.map(trip => <IonItem
                                        routerLink={`/trips/${trip.trip_id}`}
                                        key={trip.trip_id}>
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
