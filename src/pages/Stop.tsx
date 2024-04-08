import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonPopover,
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
import {add, remove} from "ionicons/icons";

interface StopPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Stop: React.FC<StopPageProps> = ({match}) => {
    const [presentLoading, dismissLoading] = useIonLoading();
    const [date, setDate] = useState(setSeconds(setMinutes(new Date(), 0), 0))
    const [debouncedDate, setDebouncedDate] = useState(date)
    const [ringSize, setRingSize] = useState(12)
    const [debouncedRingSize, setDebouncedRingSize] = useState(ringSize)
    const stop = useLiveQuery(() => scheduleDB.stop.get(match.params.id))
    const tripStops = useLiveQuery(async () => {
            await presentLoading('Lädt...')
            return (new TripStopRepository().findByStop(match.params.id, debouncedDate, debouncedRingSize))
        },
        [debouncedRingSize, debouncedDate]
    )


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
                    <IonTitle>{stop?.name}{stop?.platform ? <>: Steig {stop?.platform}</> : null}<IonNote
                        style={{display: 'block'}}>{stop?.feed_name}</IonNote></IonTitle>
                    <IonButtons slot="end">
                        <IonButton id="filter">
                            Filter
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
                                {stop ? <>{calcDistance([stop.h3_cell_le1, stop.h3_cell_le2], [tripStop.h3_cell_le1, tripStop.h3_cell_le2])} m: </> : ''}
                                {tripStop.stop_name !== stop?.name ? <>{tripStop.stop_name}</> : null}
                                {tripStop.stop_name !== stop?.name && tripStop.stop_platform ? ': ' : ''}
                                {tripStop.stop_platform ? <>Steig {tripStop.stop_platform}</> : null}
                            </IonNote>
                        </IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
            <IonPopover trigger="filter" triggerAction="click">
                <IonContent>
                    <IonItem>
                        <IonRange value={ringSize}
                                  min={1}
                                  max={26}
                                  snaps
                                  labelPlacement="start"
                                  onIonChange={(e) => setDebouncedRingSize(e.detail.value as number)}
                                  onIonInput={(e) => setRingSize(e.detail.value as number)}
                        >
                            <div slot="label">{stop ? calcRingRadius([stop.h3_cell_le1, stop.h3_cell_le2], ringSize as number) : 0} m</div>
                        </IonRange>
                    </IonItem>
                    <IonItem>
                        <IonLabel>
                            ab {date.toLocaleTimeString(undefined, {timeStyle: 'short'})} Uhr
                        </IonLabel>
                        <IonButton onClick={() => {
                            setDate(subHours(date, 1))
                        }}>
                            <IonIcon slot="icon-only" icon={remove}></IonIcon>
                        </IonButton>
                        <IonButton onClick={() => {
                            setDate(addHours(date, 1))
                        }}>
                            <IonIcon slot="icon-only" icon={add}></IonIcon>
                        </IonButton>
                    </IonItem>
                </IonContent>
            </IonPopover>
        </IonPage>
    );
};

export default Stop;
