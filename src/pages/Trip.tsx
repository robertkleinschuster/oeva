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
    IonText,
    IonTitle,
    IonToolbar, isPlatform
} from '@ionic/react';
import React from "react";
import {RouteComponentProps} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {parseStopTime} from "../transit/DateTime";
import {TripStopRepository} from "../transit/TripStopRepository";
import {Boarding} from "../db/Schedule";
import StopBoarding from "../components/StopBoarding";

interface TripPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Trip: React.FC<TripPageProps> = ({match}) => {
    const trip = useLiveQuery(() => scheduleDB.trip.get(match.params.id))
    const tripStops = useLiveQuery(() => (new TripStopRepository()
        .findByTrip(match.params.id))
    )

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>{trip?.name} {trip?.direction}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    {tripStops?.map(tripStop => <IonItem
                        routerLink={`/stops/${tripStop.stop_id}`}
                        key={tripStop.id}>
                        <IonLabel>
                            <IonNote>
                                {tripStop.arrival_time ? parseStopTime(tripStop.arrival_time, new Date()).toLocaleTimeString() : null}
                                {tripStop.arrival_time && tripStop.departure_time ? " - " : null}
                                {tripStop.departure_time ? parseStopTime(tripStop.departure_time, new Date()).toLocaleTimeString() : null}
                            </IonNote>
                            <IonText style={{display: 'block'}}>
                                {tripStop.stop_name}
                            </IonText>
                            {tripStop.boarding !== Boarding.STANDARD ?
                                <IonNote>
                                    <StopBoarding boarding={tripStop.boarding}/>
                                </IonNote> : null}
                        </IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Trip;
