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
import {StopoverRepository} from "../transit/StopoverRepository";
import {Boarding} from "../db/Schedule";
import StopoverBoarding from "../components/StopoverBoarding";

interface StationPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Trip: React.FC<StationPageProps> = ({match}) => {
    const trip = useLiveQuery(() => scheduleDB.trip.get(match.params.id))
    const stopovers = useLiveQuery(() => (new StopoverRepository()
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
                    {stopovers?.map(stopover => <IonItem
                        routerLink={`/stations/${stopover.station_id}`}
                        key={stopover.id}>
                        <IonLabel>
                            <IonNote>
                                {stopover.arrival_time ? parseStopTime(stopover.arrival_time, new Date()).toLocaleTimeString() : null}
                                {stopover.arrival_time && stopover.departure_time ? " - " : null}
                                {stopover.departure_time ? parseStopTime(stopover.departure_time, new Date()).toLocaleTimeString() : null}
                            </IonNote>
                            <IonText style={{display: 'block'}}>
                                {stopover.stop}
                            </IonText>
                            {stopover.boarding !== Boarding.STANDARD ?
                                <IonNote>
                                    <StopoverBoarding boarding={stopover.boarding}/>
                                </IonNote> : null}
                        </IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Trip;
