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
import {TripStopRepository} from "../transit/TripStopRepository";
import { setMinutes, setSeconds} from "date-fns";
import {filter} from "ionicons/icons";
import {RouteType} from "../db/Schedule";
import {Trips} from "../components/Trips";
import Filter, {FilterState} from "../components/Filter";

interface StopPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Stop: React.FC<StopPageProps> = ({match}) => {
    const [presentLoading, dismissLoading] = useIonLoading();
    const [filterState, setFilter] = useState<FilterState>({
        ringSize: 12,
        date: setSeconds(setMinutes(new Date(), 0), 0),
        rail: true,
        subway: true,
        trams: true,
        busses: true,
        other: true
    })

    const stop = useLiveQuery(() => scheduleDB.stop.get(match.params.id))
    const tripStops = useLiveQuery(async () => {
            await presentLoading('Lädt...')
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
            return (new TripStopRepository().findByStop(match.params.id, filterState.date, filterState.ringSize, routeTypes))
        },
        [filterState]
    )

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
                {stop && tripStops ? <Trips stop={stop} tripStops={tripStops} date={filterState.date}/> : null}
            </IonContent>
            {stop ? <Filter stop={stop} state={filterState} onChange={state => setFilter(state)}/> : null}
        </IonPage>
    );
};

export default Stop;
