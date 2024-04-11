import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonNote,
    IonPage,
    IonPopover,
    IonRange,
    IonTitle,
    IonToggle,
    IonToolbar,
    isPlatform,
    useIonLoading
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {RouteComponentProps} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {TripStopRepository} from "../transit/TripStopRepository";
import {addHours, setMinutes, setSeconds, subHours} from "date-fns";
import {calcRingRadius} from "../transit/Geo";
import {add, filter, remove} from "ionicons/icons";
import {RouteType} from "../db/Schedule";
import {Trips} from "../components/Trips";

interface StopPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Stop: React.FC<StopPageProps> = ({match}) => {
    const [presentLoading, dismissLoading] = useIonLoading();
    const [date, setDate] = useState(setSeconds(setMinutes(new Date(), 0), 0))
    const [debouncedDate, setDebouncedDate] = useState(date)
    const [rail, setRail] = useState(true)
    const [subway, setSubway] = useState(true)
    const [trams, setTrams] = useState(true)
    const [busses, setBuses] = useState(true)
    const [other, setOther] = useState(true)
    const [ringSize, setRingSize] = useState(12)
    const [debouncedRingSize, setDebouncedRingSize] = useState(ringSize)
    const stop = useLiveQuery(() => scheduleDB.stop.get(match.params.id))
    const tripStops = useLiveQuery(async () => {
            await presentLoading('Lädt...')
            const routeTypes: RouteType[] = [];
            if (rail) {
                routeTypes.push(RouteType.RAIL)
            }
            if (subway) {
                routeTypes.push(RouteType.SUBWAY)
            }
            if (trams) {
                routeTypes.push(RouteType.TRAM)
                routeTypes.push(RouteType.CABLE_TRAM)
            }
            if (busses) {
                routeTypes.push(RouteType.BUS)
                routeTypes.push(RouteType.TROLLEYBUS)
            }
            if (other) {
                routeTypes.push(RouteType.AERIAL_LIFT)
                routeTypes.push(RouteType.FERRY)
                routeTypes.push(RouteType.FUNICULAR)
                routeTypes.push(RouteType.MONORAIL)
            }
            return (new TripStopRepository().findByStop(match.params.id, debouncedDate, debouncedRingSize, routeTypes))
        },
        [debouncedRingSize, debouncedDate, rail, subway, trams, busses, other]
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
                    <IonTitle>{stop?.name}{stop?.platform ? <>:
                        Steig {stop?.platform}</> : null}{" "}<IonNote>({stop?.feed_name})</IonNote></IonTitle>
                    <IonButtons slot="end">
                        <IonButton id={"filter-" + stop?.id} aria-label="Filter">
                            <IonIcon slot="icon-only" icon={filter}/>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {stop && tripStops && date ? <Trips stop={stop} tripStops={tripStops} date={date}/> : null}
            </IonContent>
            <IonPopover trigger={"filter-" + stop?.id} triggerAction="click">
                <IonItem>
                    <IonRange value={ringSize}
                              min={1}
                              max={26}
                              snaps
                              labelPlacement="start"
                              onIonChange={(e) => setDebouncedRingSize(e.detail.value as number)}
                              onIonInput={(e) => setRingSize(e.detail.value as number)}
                    >
                        <div
                            slot="label">{stop ? calcRingRadius([stop.h3_cell_le1, stop.h3_cell_le2], ringSize as number) : 0} m
                        </div>
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
                <IonItem>
                    <IonToggle checked={rail} onIonChange={() => setRail(!rail)}>Züge</IonToggle>
                </IonItem>
                <IonItem>
                    <IonToggle checked={subway} onIonChange={() => setSubway(!subway)}>U-Bahn</IonToggle>
                </IonItem>
                <IonItem>
                    <IonToggle checked={trams} onIonChange={() => setTrams(!trams)}>Straßenbahnen</IonToggle>
                </IonItem>
                <IonItem>
                    <IonToggle checked={busses} onIonChange={() => setBuses(!busses)}>Busse</IonToggle>
                </IonItem>
                <IonItem>
                    <IonToggle checked={other} onIonChange={() => setOther(!other)}>Andere</IonToggle>
                </IonItem>
            </IonPopover>
        </IonPage>
    );
};

export default Stop;
