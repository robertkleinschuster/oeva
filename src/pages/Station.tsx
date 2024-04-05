import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonRange,
    IonText,
    IonTitle,
    IonToolbar,
    isPlatform
} from '@ionic/react';
import React, {useEffect, useRef, useState} from "react";
import {RouteComponentProps} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {parseStopTime} from "../transit/DateTime";
import {StopoverRepository} from "../transit/StopoverRepository";
import {cellToLatLng, greatCircleDistance, gridRingUnsafe, UNITS} from "h3-js";
import {getHours, getMinutes} from "date-fns";

interface StationPageProps extends RouteComponentProps<{
    id: string
}> {
}

const calcRingRadius = (center: string, ringSize: number) => {
    const ring = gridRingUnsafe(center, ringSize)
    if (ring.length) {
        return calcDistance(ring[0], center)
    }
    return 0;
}

const calcDistance = (a: string, b: string) => {
    return Math.round(greatCircleDistance(cellToLatLng(a), cellToLatLng(b), UNITS.m))
}

const timeWindow = 60;

const Station: React.FC<StationPageProps> = ({match}) => {
    const [date, setDate] = useState(new Date)
    const scrollLoader = useRef<HTMLIonInfiniteScrollElement | null>(null)
    const [ringSize, setRingSize] = useState(12)
    const [minutesFrom, setMinutesFrom] = useState(getHours(date) * 60 + getMinutes(date))
    const [minutesTo, setMinutesTo] = useState(minutesFrom + timeWindow)
    const [ringSizeToLoad, setRingSizeToLoad] = useState(ringSize)
    const station = useLiveQuery(() => scheduleDB.station.get(match.params.id))
    const [ringRadius, setRingRadius] = useState(0)
    const stopovers = useLiveQuery(() => (new StopoverRepository()
            .findByStation(match.params.id, date, minutesFrom, minutesTo, ringSizeToLoad)),
        [ringSizeToLoad, minutesFrom, minutesTo]
    )

    useEffect(() => {
        if (station?.h3_cell) {
            setRingRadius(calcRingRadius(station?.h3_cell, ringSize))
        }
    }, [ringSize, station]);

    useEffect(() => {
        if (scrollLoader.current) {
            scrollLoader.current.complete()
        }
    }, [stopovers]);

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
                              max={27}
                              label={`Umgebung ${ringRadius} m`}
                              onIonInput={e => setRingSize(Number(e.detail.value))}
                              onIonChange={() => setRingSizeToLoad(ringSize)}></IonRange>
                    <IonButtons slot="end">
                        <IonButton onClick={() => {
                            const newMinutesFrom = minutesFrom > timeWindow ? minutesFrom - timeWindow : 0;
                            setMinutesFrom(newMinutesFrom)
                            setMinutesTo(newMinutesFrom + timeWindow)
                        }}>
                            <IonLabel>Früher</IonLabel>
                        </IonButton>
                        <IonButton onClick={() => {
                            setMinutesFrom(minutesTo)
                            setMinutesTo(minutesTo + timeWindow)
                        }}>
                            <IonLabel>Später</IonLabel>
                        </IonButton>
                    </IonButtons>
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
