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
                    {stopovers?.filter(stopover => stopover.departure_time)?.map(stopover => <IonItem
                        routerLink={`/trips/${stopover.trip_id}`}
                        key={stopover.trip_id}>
                        <IonLabel>
                            <IonText style={{display: 'block'}}>
                                {parseStopTime(stopover.departure_time!, new Date()).toLocaleTimeString()} {stopover.line} {stopover.direction}
                            </IonText>
                            {stopover.stop !== station?.name ? <IonNote color="medium">{stopover.stop}</IonNote> : null}
                        </IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Station;
