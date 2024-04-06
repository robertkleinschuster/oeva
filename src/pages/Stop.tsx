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
    isPlatform,
    useIonLoading
} from '@ionic/react';
import React, {useEffect, useRef, useState} from "react";
import {RouteComponentProps, useLocation} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {parseStopTimeInt} from "../transit/DateTime";
import {TripStopRepository} from "../transit/TripStopRepository";
import {addHours, setMinutes, setSeconds, subHours} from "date-fns";
import {calcDistance, calcRingRadius} from "../transit/Geo";

interface StopPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Stop: React.FC<StopPageProps> = ({match}) => {
    const [presentLoading, dismissLoading] = useIonLoading();
    const [date, setDate] = useState(setSeconds(setMinutes(new Date(), 0), 0))
    const [debouncedDate, setDebouncedDate] = useState(date)
    const [ringSize, setRingSize] = useState(12)
    const [ringSizeToLoad, setRingSizeToLoad] = useState(ringSize)
    const stop = useLiveQuery(() => scheduleDB.stop.get(match.params.id))
    const [ringRadius, setRingRadius] = useState(0)
    const tripStops = useLiveQuery(async () => {
            await presentLoading('Lädt...')
            return (new TripStopRepository().findByStop(match.params.id, debouncedDate, ringSize))
        },
        [ringSizeToLoad, debouncedDate]
    )

    useEffect(() => {
        if (stop?.h3_cell) {
            setRingRadius(calcRingRadius(stop.h3_cell, ringSize))
        }
    }, [ringSize, stop]);

    useEffect(() => {
        const delayInputTimeoutId = setTimeout(() => {
            setDebouncedDate(date);
        }, 500);
        return () => clearTimeout(delayInputTimeoutId);
    }, [date]);

    if (tripStops !== undefined) {
        void dismissLoading()
    }

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
                </IonToolbar>
                <IonToolbar>
                    <IonButtons slot="end">
                        <IonLabel>ab {date.toLocaleTimeString(undefined, {timeStyle: 'short'})} Uhr</IonLabel>
                        <IonButton onClick={() => {
                            setDate(subHours(date, 1))
                        }}>
                            <IonLabel>Früher</IonLabel>
                        </IonButton>
                        <IonButton onClick={() => {
                            setDate(addHours(date, 1))
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
                                    Ankunft: {parseStopTimeInt(tripStop.arrival_time, date).toLocaleTimeString()}
                                </IonNote> : null}
                            {tripStop.departure_time ?
                                <IonNote
                                    style={{display: 'block'}}>
                                    Abfahrt: {parseStopTimeInt(tripStop.departure_time, date).toLocaleTimeString()}
                                </IonNote> : null}
                            <IonText style={{display: 'block'}}>
                                {tripStop.trip_name} {tripStop.direction}
                            </IonText>
                            <IonNote color="medium" style={{display: 'block'}}>
                                {stop?.h3_cell && stop?.h3_cell !== tripStop.h3_cell ? <>{calcDistance(stop.h3_cell, tripStop.h3_cell)} m: </> : ''}{tripStop.stop_name}{tripStop.stop_platform ? <>:
                                Steig {tripStop.stop_platform}</> : null}
                            </IonNote>
                        </IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Stop;
