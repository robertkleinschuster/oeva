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
import React, {useState} from "react";
import {RouteComponentProps} from "react-router";
import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {FilterState, TripStopRepository} from "../transit/TripStopRepository";
import {addHours, setMinutes, setSeconds} from "date-fns";
import {filter} from "ionicons/icons";
import {Trips} from "../components/Trips";
import Filter from "../components/Filter";
import StopMap from "../components/StopMap";
import {parseStopTimeInt} from "../transit/DateTime";

interface StopPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Stop: React.FC<StopPageProps> = ({match}) => {
    const [presentLoading, dismissLoading] = useIonLoading();
    const [filterState, setFilter] = useState<FilterState>({
        ringSize: 12,
        date: setSeconds(setMinutes(new Date(), 0), 0),
        arrivals: false,
        rail: true,
        subway: true,
        trams: true,
        busses: true,
        trolleybusses: true,
        other: true
    })

    const stop = useLiveQuery(() => scheduleDB.stop.get(match.params.id))
    const tripStops = useLiveQuery(async () => {
            await dismissLoading()
            await presentLoading('Lädt...')
            const repo = new TripStopRepository()
            const tripStops = await (repo.findByStop(match.params.id, filterState))
            tripStops.push(...await repo.findByStop(match.params.id,{...filterState, date: addHours(filterState.date, 1)}))
            await dismissLoading()
            return tripStops.filter(tripStop => {
                const time = tripStop.arrival_time ?? tripStop.departure_time;
                if (time !== undefined) {
                    const stopDate = parseStopTimeInt(time, filterState.date);
                    return stopDate >= filterState.date && stopDate <= addHours(filterState.date, 1);
                }
                return false;
            })
        },
        [filterState]
    )

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
                {stop ?
                    <StopMap cell={[stop.h3_cell_le1, stop.h3_cell_le2]} tooltip={stop.name}/>
                    : null}
                {stop && tripStops ? <Trips stop={stop} tripStops={tripStops} date={filterState.date}/> : null}
            </IonContent>
            {stop ? <Filter stop={stop} state={filterState} onChange={state => setFilter(state)}/> : null}
        </IonPage>
    );
};

export default Stop;
