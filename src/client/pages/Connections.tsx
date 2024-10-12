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
    isPlatform
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {RouteComponentProps} from "react-router";
import {FilterState, TripStopRepository} from "../transit/TripStopRepository";
import {addHours, setHours, setMinutes, setSeconds} from "date-fns";
import {filter} from "ionicons/icons";
import {Trips} from "../components/Trips";
import {formatDisplayTime, parseStopTimeInt} from "../transit/DateTime";
import Filter from "../components/Filter";
import TripName from "../components/TripName";
import StopMap from "../components/StopMap";
import {FullTripStop} from "../db/schema";
import {db} from "../db/client";

interface ConnectionsPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Connections: React.FC<ConnectionsPageProps> = ({match}) => {
    const [filterState, setFilter] = useState<FilterState | undefined>()
    const [tripStop, setTripStop] = useState<FullTripStop | undefined>()
    const [tripStops, setTripStops] = useState<FullTripStop[]>()

    useEffect(() => {
        db.selectFrom('trip_stop')
            .innerJoin('stop', 'trip_stop.stop_id', 'stop.stop_id')
            .innerJoin('trip', 'trip_stop.trip_id', 'trip.trip_id')
            .selectAll()
            .where('trip_stop_id', '=', match.params.id)
            .executeTakeFirstOrThrow()
            .then(setTripStop)
    }, [match.params.id]);

    useEffect(() => {
            void (async () => {
                if (!tripStop || !filterState) {
                    return undefined;
                }
                const repo = new TripStopRepository();
                const tripStops = await repo.findConnections(tripStop, filterState)
                tripStops.push(...await repo.findConnections(tripStop, {
                    ...filterState,
                    date: addHours(filterState.date, 1)
                }))

                setTripStops(tripStops.filter(tripStop => {
                    const time = tripStop.arrival_time ?? tripStop.departure_time;
                    if (time !== null) {
                        const stopDate = parseStopTimeInt(time, filterState.date);
                        return stopDate >= filterState.date && stopDate <= addHours(filterState.date, 1);
                    }
                    return false;
                }))
            })()
        },
        [tripStop, filterState]
    )


    useEffect(() => {
        const filterDefaults: FilterState = {
            ringSize: 12,
            date: new Date(),
            arrivals: false,
            rail: true,
            subway: true,
            trams: true,
            busses: true,
            trolleybusses: true,
            other: true
        }
        const hour = tripStop?.hour
        const time = tripStop?.arrival_time ?? tripStop?.departure_time ?? null;
        if (time !== null) {
            setFilter({...filterDefaults, date: parseStopTimeInt(time, new Date())})
        } else if (hour !== undefined) {
            setFilter({...filterDefaults, date: setHours(setSeconds(setMinutes(new Date(), 0), 0), hour)})
        }
    }, [tripStop]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>{tripStop?.stop_name}{tripStop?.platform ? <>: Steig {tripStop?.platform}</> : null}{" "}
                        <IonNote>({tripStop?.feed_name})</IonNote></IonTitle>
                    <IonButtons slot="end">
                        <IonButton id={"filter-" + tripStop?.stop_id} aria-label="Filter">
                            <IonIcon slot="icon-only" icon={filter}/>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {tripStop ?
                    <StopMap cell={tripStop.h3_cell} tooltip={stop.name}/>
                    : null}
                {tripStop && filterState && tripStop.arrival_time ?
                    <IonNote color="medium" class="ion-margin" style={{display: 'block'}}>
                        Anschlüsse an {tripStop ?
                        <TripName
                            trip={tripStop}/> : null} um {formatDisplayTime(tripStop.arrival_time, filterState.date)}
                    </IonNote>
                    : null}
                {tripStop && tripStops && filterState ?
                    <Trips stop={tripStop} tripStops={tripStops} date={filterState.date}/> : null}
            </IonContent>
            {tripStop && filterState ?
                <Filter stop={tripStop} state={filterState} onChange={state => setFilter(state)}/> : null}
        </IonPage>
    );
};

export default Connections;
