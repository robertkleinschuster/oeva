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
import {TripStopRepository} from "../transit/TripStopRepository";
import {cellToLatLng, greatCircleDistance, gridRingUnsafe, UNITS} from "h3-js";
import {getHours, getMinutes} from "date-fns";

interface StopPageProps extends RouteComponentProps<{
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

const Stop: React.FC<StopPageProps> = ({match}) => {
    const [date, setDate] = useState(new Date)
    const scrollLoader = useRef<HTMLIonInfiniteScrollElement | null>(null)
    const [ringSize, setRingSize] = useState(12)
    const [minutesFrom, setMinutesFrom] = useState(getHours(date) * 60 + getMinutes(date))
    const [minutesTo, setMinutesTo] = useState(minutesFrom + timeWindow)
    const [ringSizeToLoad, setRingSizeToLoad] = useState(ringSize)
    const stop = useLiveQuery(() => scheduleDB.stop.get(match.params.id))
    const [ringRadius, setRingRadius] = useState(0)
    const tripStops = useLiveQuery(() => (new TripStopRepository()
            .findByStop(match.params.id, date, minutesFrom, minutesTo, ringSizeToLoad)),
        [ringSizeToLoad, minutesFrom, minutesTo]
    )

    useEffect(() => {
        if (stop?.h3_cell) {
            setRingRadius(calcRingRadius(stop?.h3_cell, ringSize))
        }
    }, [ringSize, stop]);

    useEffect(() => {
        if (scrollLoader.current) {
            scrollLoader.current.complete()
        }
    }, [tripStops]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>{stop?.name}{stop?.platform ? <>: Steig {stop?.platform}</> : null}</IonTitle>
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
                    {tripStops?.map(tripStop => <IonItem
                        routerLink={`/trips/${tripStop.trip_id}`}
                        key={tripStop.id}>
                        <IonLabel>
                            {tripStop.arrival_time ?
                                <IonNote
                                    style={{display: 'block'}}>
                                    Ankunft: {parseStopTime(tripStop.arrival_time, new Date()).toLocaleTimeString()}
                                </IonNote> : null}
                            {tripStop.departure_time ?
                                <IonNote
                                    style={{display: 'block'}}>
                                    Abfahrt: {parseStopTime(tripStop.departure_time, new Date()).toLocaleTimeString()}
                                </IonNote> : null}
                            <IonText style={{display: 'block'}}>
                                {tripStop.trip_name} {tripStop.direction}
                            </IonText>
                            <IonNote color="medium" style={{display: 'block'}}>
                                {stop?.h3_cell && stop?.h3_cell !== tripStop.h3_cell ? <>{calcDistance(stop.h3_cell, tripStop.h3_cell)} m: </> : ''}{tripStop.stop_name}{tripStop.stop_platform ? <>: Steig {tripStop.stop_platform}</> : null}
                            </IonNote>
                        </IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Stop;
