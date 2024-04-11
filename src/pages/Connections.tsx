import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonNote,
    IonPage,
    IonTitle,
    IonToolbar,
    isPlatform,
    useIonLoading
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {RouteComponentProps} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {TripStopRepository} from "../transit/TripStopRepository";
import {addHours, setHours, setMinutes, setSeconds, subHours} from "date-fns";
import {filter} from "ionicons/icons";
import {RouteType} from "../db/Schedule";
import {Trips} from "../components/Trips";
import {formatDisplayTime, parseStopTimeInt} from "../transit/DateTime";
import Filter, {FilterState} from "../components/Filter";

interface ConnectionsPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Connections: React.FC<ConnectionsPageProps> = ({match}) => {
    const [presentLoading, dismissLoading] = useIonLoading();
    const [filterState, setFilter] = useState<FilterState|undefined>()

    const tripStop = useLiveQuery(() => scheduleDB.trip_stop.get(match.params.id), [match.params.id])
    const stop = useLiveQuery(() => tripStop ? scheduleDB.stop.get(tripStop.stop_id) : undefined, [tripStop])
    const tripStops = useLiveQuery(async () => {
            if (!tripStop || !filterState) {
                return undefined;
            }
            const routeTypes: RouteType[] = [];
            if (filterState.rail) {
                routeTypes.push(RouteType.RAIL)
            }
            if (filterState.subway) {
                routeTypes.push(RouteType.SUBWAY)
            }
            if (filterState.trams) {
                routeTypes.push(RouteType.TRAM)
                routeTypes.push(RouteType.CABLE_TRAM)
            }
            if (filterState.busses) {
                routeTypes.push(RouteType.BUS)
                routeTypes.push(RouteType.TROLLEYBUS)
            }
            if (filterState.other) {
                routeTypes.push(RouteType.AERIAL_LIFT)
                routeTypes.push(RouteType.FERRY)
                routeTypes.push(RouteType.FUNICULAR)
                routeTypes.push(RouteType.MONORAIL)
            }
            await presentLoading('Lädt...')
            const repo = new TripStopRepository();
            const tripStops = await repo.findConnections(tripStop, filterState.date, filterState.ringSize, routeTypes)
            tripStops.push(...await repo.findConnections(tripStop, addHours(filterState.date, 1), filterState.ringSize, routeTypes))
            return tripStops.filter(tripStop => {
                const time = tripStop.arrival_time ?? tripStop.departure_time;
                if (time !== undefined) {
                    const stopDate = parseStopTimeInt(time, filterState.date);
                    return stopDate >= filterState.date && stopDate <= addHours(filterState.date, 1);
                }
                return false;
            })
        },
        [tripStop, filterState]
    )


    useEffect(() => {
        const filterDefaults = {
            ringSize: 12,
            date: setSeconds(setMinutes(new Date(), 0), 0),
            rail: true,
            subway: true,
            trams: true,
            busses: true,
            other: true
        }
        const hour = tripStop?.hour
        const time = tripStop?.arrival_time ?? tripStop?.departure_time;
        if (time !== undefined) {
            setFilter({...filterDefaults, date: parseStopTimeInt(time, new Date())})
        } else if (hour !== undefined) {
            setFilter({...filterDefaults, date: setHours(setSeconds(setMinutes(new Date(), 0), 0), hour)})
        }
    }, [tripStop]);

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
                    <IonTitle>{stop?.name}{stop?.platform ? <>: Steig {stop?.platform}</> : null}{" "}
                        <IonNote>({stop?.feed_name})</IonNote></IonTitle>
                    <IonButtons slot="end">
                        <IonButton id={"filter-" + stop?.id} aria-label="Filter">
                            <IonIcon slot="icon-only" icon={filter}/>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {tripStop && filterState && tripStop.arrival_time ?
                    <IonNote color="medium" class="ion-margin" style={{display: 'block'}}>
                        Anschlüsse an {tripStop.trip_name} {tripStop.direction} um {formatDisplayTime(tripStop.arrival_time, filterState.date)}
                    </IonNote>
                    : null}
                {stop && tripStops && filterState ? <Trips stop={stop} tripStops={tripStops} date={filterState.date}/> : null}
            </IonContent>
            {stop && filterState ? <Filter stop={stop} state={filterState} onChange={state => setFilter(state)}/> : null}
        </IonPage>
    );
};

export default Connections;
