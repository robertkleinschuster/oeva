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
    const scrollLoader = useRef<HTMLIonInfiniteScrollElement | null>(null)
    const [ringSize, setRingSize] = useState(50)
    const [minutes, setMinutes] = useState(60)
    const [ringSizeToLoad, setRingSizeToLoad] = useState(ringSize)
    const station = useLiveQuery(() => scheduleDB.station.get(match.params.id))
    const [ringRadius, setRingRadius] = useState(0)
    const stopovers = useLiveQuery(() => (new StopoverRepository()
            .findByStation(match.params.id, new Date(), ringSizeToLoad, minutes)),
        [ringSizeToLoad, minutes]
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
                    <IonItem button detail={false} onClick={() => setMinutes(minutes + 60)}>
                        <IonLabel>Mehr laden</IonLabel>
                    </IonItem>
                </IonList>
                <IonInfiniteScroll
                    ref={scrollLoader}
                    onIonInfinite={(ev) => {
                        setMinutes(minutes + 60)
                    }}
                >
                    <IonInfiniteScrollContent></IonInfiniteScrollContent>
                </IonInfiniteScroll>
            </IonContent>
        </IonPage>
    );
};

export default Station;
