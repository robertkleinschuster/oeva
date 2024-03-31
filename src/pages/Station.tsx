import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader, IonItem, IonLabel,
    IonList, IonNote,
    IonPage, IonText,
    IonTitle,
    IonToolbar, isPlatform
} from '@ionic/react';
import React from "react";
import {RouteComponentProps} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {parseStopTime} from "../transit/DateTime";
import {StopoverRepository} from "../transit/StopoverRepository";

interface StationPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Station: React.FC<StationPageProps> = ({match}) => {
    const station = useLiveQuery(() => scheduleDB.station.get(match.params.id))
    const stopovers = useLiveQuery(() => (new StopoverRepository()
        .findByStation(match.params.id, new Date()))
    )

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>{station?.name}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    {stopovers?.map(stopover => <IonItem
                        routerLink={`/trips/${stopover.trip_id}`}
                        key={stopover.trip_id}>
                        <IonLabel>
                            {stopover.arrival_time ?
                                <IonNote
                                    style={{display: 'block'}}>
                                    Ankunft: {parseStopTime(stopover.arrival_time, new Date()).toLocaleTimeString()}
                                </IonNote> : null}
                            {stopover.departure_time ?
                                <IonNote
                                    style={{display: 'block'}}>
                                    Abfahrt: {parseStopTime(stopover.departure_time, new Date()).toLocaleTimeString()}
                                </IonNote> : null}
                            <IonText style={{display: 'block'}}>
                                {stopover.line} {stopover.direction}
                            </IonText>
                            <IonNote color="medium" style={{display: 'block'}}>
                                {stopover.stop}
                            </IonNote>
                        </IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Station;
