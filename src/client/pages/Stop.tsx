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
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {RouteComponentProps} from "react-router";
import {FilterState, TripStopRepository} from "../transit/TripStopRepository";
import {addHours} from "date-fns";
import {filter} from "ionicons/icons";
import {Trips} from "../components/Trips";
import Filter from "../components/Filter";
import {parseStopTimeInt} from "../transit/DateTime";
import {FullTripStop, Stop as StopType} from "../db/schema";
import {db} from "../db/client";

interface StopPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Stop: React.FC<StopPageProps> = ({match}) => {
    const [filterState, setFilter] = useState<FilterState>({
        ringSize: 12,
        date: new Date(),
        arrivals: false,
        rail: true,
        subway: true,
        trams: true,
        busses: true,
        trolleybusses: true,
        other: true
    })

    const [stop, setStop] = useState<StopType | undefined>(undefined)

    useEffect(() => {
        db.selectFrom('stop')
            .selectAll()
            .where('stop_id', '=', match.params.id)
            .executeTakeFirstOrThrow()
            .then(setStop)

    }, [match.params.id]);

    const [tripStops, setTripStops] = useState<FullTripStop[]>([]);

    useEffect(() => {
        const repo = new TripStopRepository()
        void (async () => {
            const tripStops = await (repo.findByStop(match.params.id, filterState))
            tripStops.push(...await repo.findByStop(match.params.id, {
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
    }, [filterState]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>{stop?.stop_name}{stop?.platform ? <>:
                        Steig {stop?.platform}</> : null}{" "}<IonNote>({stop?.feed_name})</IonNote></IonTitle>
                    <IonButtons slot="end">
                        <IonButton id={"filter-" + stop?.stop_id} aria-label="Filter">
                            <IonIcon slot="icon-only" icon={filter}/>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {stop && tripStops ? <Trips stop={stop} tripStops={tripStops} date={filterState.date}/> : null}
            </IonContent>
            {stop ? <Filter stop={stop} state={filterState} onChange={state => setFilter(state)}/> : null}
        </IonPage>
    );
};

export default Stop;
