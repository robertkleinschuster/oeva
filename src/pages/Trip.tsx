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
    IonToolbar,
    isPlatform
} from '@ionic/react';
import React from "react";
import {RouteComponentProps} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {formatDisplayTime} from "../transit/DateTime";
import {TripStopRepository} from "../transit/TripStopRepository";
import {Boarding} from "../db/Schedule";
import StopBoarding from "../components/StopBoarding";
import {setSeconds} from "date-fns";
import {extractExceptions, extractWeekdays, weekdayNames} from "../transit/Schedule";
import {ExceptionType} from "../db/GTFS";

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
                    <IonTitle>{trip?.name} {trip?.direction} <IonNote>({trip?.feed_name})</IonNote></IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent color="light">
                <IonList>
                    {tripStops?.map(tripStop => <IonItem
                        routerLink={`/stops/${tripStop.stop_id}`}
                        key={tripStop.id}>
                        <IonLabel>
                            <IonNote>
                                {tripStop.arrival_time !== undefined ? formatDisplayTime(tripStop.arrival_time, date) : null}
                                {tripStop.arrival_time !== undefined && tripStop.departure_time !== undefined ? " - " : null}
                                {tripStop.departure_time !== undefined ? formatDisplayTime(tripStop.departure_time, date) : null}
                            </IonNote>
                            <IonText style={{display: 'block'}}>
                                {tripStop.stop_name}{tripStop.stop_platform ? <>:
                                Steig {tripStop.stop_platform}</> : null}
                            </IonText>
                            {tripStop.boarding !== Boarding.STANDARD ?
                                <IonNote>
                                    <StopBoarding boarding={tripStop.boarding}/>
                                </IonNote> : null}
                        </IonLabel>
                    </IonItem>)}
                </IonList>
                <br/>
                <IonNote className="ion-padding" color="medium">
                    Verkehrt:&nbsp;{trip ? extractWeekdays(trip.service_weekdays).map(weekday => weekdayNames.get(weekday)).join(', ') : null}
                </IonNote>
                <br/>
                <IonNote className="ion-padding" color="medium">
                    Ausgenommen:&nbsp;
                    {trip?.service_exceptions ? extractExceptions(trip.service_exceptions, ExceptionType.NOT_RUNNING).map(date => date.toLocaleDateString()).join(', ') : null}
                </IonNote>
                <br/>
                <IonNote className="ion-padding" color="medium">
                    Zusätzlich:&nbsp;
                    {trip?.service_exceptions ? extractExceptions(trip.service_exceptions, ExceptionType.RUNNING).map(date => date.toLocaleDateString()).join(', ') : null}
                </IonNote>
            </IonContent>
        </IonPage>
    );
};

export default Trip;
