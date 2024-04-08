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
import {parseStopTimeInt} from "../transit/DateTime";
import {TripStopRepository} from "../transit/TripStopRepository";
import {Boarding} from "../db/Schedule";
import StopBoarding from "../components/StopBoarding";
import {setSeconds} from "date-fns";

interface TripPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Trip: React.FC<TripPageProps> = ({match}) => {
    const trip = useLiveQuery(() => scheduleDB.trip.get(match.params.id))
    const tripStops = useLiveQuery(() => (new TripStopRepository()
        .findByTrip(match.params.id))
    )
    const date = setSeconds(new Date(), 0);
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>{trip?.name} {trip?.direction}<IonNote style={{display: 'block'}}>{trip?.feed_name}</IonNote></IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    {tripStops?.map(tripStop => <IonItem
                        routerLink={`/stops/${tripStop.stop_id}`}
                        key={tripStop.id}>
                        <IonLabel>
                            <IonNote>
                                {tripStop.arrival_time !== undefined ? parseStopTimeInt(tripStop.arrival_time, date).toLocaleTimeString() : null}
                                {tripStop.arrival_time !== undefined && tripStop.departure_time !== undefined ? " - " : null}
                                {tripStop.departure_time !== undefined ? parseStopTimeInt(tripStop.departure_time, date).toLocaleTimeString() : null}
                            </IonNote>
                            <IonText style={{display: 'block'}}>
                                {tripStop.stop_name}{tripStop.stop_platform ? <>: Steig {tripStop.stop_platform}</> : null}
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
