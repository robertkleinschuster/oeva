import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel,
    IonList, IonNote,
    IonPage, IonRange, IonText,
    IonTitle,
    IonToolbar, isPlatform
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

const Station: React.FC<StationPageProps> = ({match}) => {
    const [date, setDate] = useState(new Date)
    const scrollLoader = useRef<HTMLIonInfiniteScrollElement | null>(null)
    const [ringSize, setRingSize] = useState(12)
    const [minutesFrom, setMinutesFrom] = useState(getHours(date) * 60 + getMinutes(date))
    const [minutesTo, setMinutesTo] = useState(minutesFrom + 60)
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
                              max={50}
                              label={`Umgebung ${ringRadius} m`}
                              onIonInput={e => setRingSize(Number(e.detail.value))}
                              onIonChange={e => setRingSizeToLoad(ringSize)}></IonRange>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonList>
                    <IonItem button detail={false} onClick={() => {
                        const newMinutesFrom = minutesFrom > 60 ? minutesFrom - 60 : 0;
                        setMinutesFrom(newMinutesFrom)
                        setMinutesTo(newMinutesFrom + 60)
                    }}>
                        <IonLabel>Früher</IonLabel>
                    </IonItem>
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
                    <IonItem button detail={false} onClick={() => setMinutesTo(minutesTo + 60)}>
                        <IonLabel>Später</IonLabel>
                    </IonItem>
                </IonList>
                {minutesTo < 24 * 60 ?
                <IonInfiniteScroll
                    ref={scrollLoader}
                    onIonInfinite={(ev) => {
                        setMinutesTo(minutesTo + 60)
                    }}
                >
                    <IonInfiniteScrollContent></IonInfiniteScrollContent>
                </IonInfiniteScroll> : null}
            </IonContent>
        </IonPage>
    );
};

export default Station;
