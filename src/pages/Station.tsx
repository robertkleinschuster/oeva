import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader, IonItem, IonLabel,
    IonList, IonNote,
    IonPage, IonRange, IonText,
    IonTitle,
    IonToolbar, isPlatform
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {RouteComponentProps} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {parseStopTime} from "../transit/DateTime";
import {StopoverRepository} from "../transit/StopoverRepository";
import {cellToLatLng, greatCircleDistance, UNITS} from "h3-js";

interface StationPageProps extends RouteComponentProps<{
    id: string
}> {
}

const EDGE_LENGTH_METERS = 0.001546100 * 1000

const calcRingRadius = (ringSize: number) => {
    return Math.round(ringSize * EDGE_LENGTH_METERS)
}

const calcDistance = (a: string, b: string) => {
    return Math.round(greatCircleDistance(cellToLatLng(a), cellToLatLng(b), UNITS.m))
}

const Station: React.FC<StationPageProps> = ({match}) => {
    const [ringSize, setRingSize] = useState(100)
    const [ringSizeToLoad, setRingSizeToLoad] = useState(ringSize)
    const [ringRadius, setRingRadius] = useState(calcRingRadius(ringSize))
    const station = useLiveQuery(() => scheduleDB.station.get(match.params.id))
    const stopovers = useLiveQuery(() => (new StopoverRepository()
        .findByStation(match.params.id, new Date(), ringSizeToLoad)),
        [ringSizeToLoad]
    )

    useEffect(() => {
        setRingRadius(calcRingRadius(ringSize))
    }, [ringSize]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>{station?.name}</IonTitle>
                </IonToolbar>
                <IonToolbar>
                    <IonRange style={{margin: '0 1rem'}}
                              value={ringSize}
                              max={500}
                              label={`Umgebung ${ringRadius} m`}
                              onIonInput={e => setRingSize(Number(e.detail.value))}
                              onIonChange={e => setRingSizeToLoad(ringSize)}></IonRange>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    {stopovers?.map(stopover => <IonItem
                        routerLink={`/trips/${stopover.trip_id}`}
                        key={stopover.id}>
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
                                {station?.h3_cell && station?.h3_cell !== stopover.h3_cell ? <>{calcDistance(station.h3_cell, stopover.h3_cell)} m: </> : ''}{stopover.stop}
                            </IonNote>
                        </IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Station;
