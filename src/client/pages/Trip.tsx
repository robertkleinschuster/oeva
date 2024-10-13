import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonText,
    IonTitle,
    IonToolbar,
    isPlatform
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {RouteComponentProps} from "react-router";
import {formatDisplayTime} from "../transit/DateTime";
import {TripStopRepository} from "../transit/TripStopRepository";
import {Boarding} from "../db/enums";
import StopBoarding from "../components/StopBoarding";
import {setSeconds} from "date-fns";
import {extractExceptions} from "../transit/Schedule";
import {ExceptionType} from "../db/gtfs-types";
import TripName from "../components/TripName";
import type {Exception, FullTripStop, Service, Trip as TripType} from "../db/schema"
import {db} from "../db/client";
import {Selectable} from "kysely";

interface TripPageProps extends RouteComponentProps<{
    id: string
}> {
}

const Trip: React.FC<TripPageProps> = ({match}) => {
    const [trip, setTrip] = useState<TripType | undefined>()
    const [service, setService] = useState<Service | undefined>()
    const [exceptions, setExceptions] = useState<Selectable<Exception>[]>([])
    const [tripStops, setTripStops] = useState<FullTripStop[] | null>([])
    useEffect(() => {
        db.selectFrom('trip')
            .selectAll()
            .where('trip_id', '=', match.params.id)
            .executeTakeFirstOrThrow()
            .then(setTrip)
    }, [match.params.id]);

    useEffect(() => {
        if (trip) {
            db.selectFrom('service')
                .selectAll()
                .where('service_id', '=', trip.service_id)
                .executeTakeFirstOrThrow()
                .then(setService)
        }
    }, [trip]);

    useEffect(() => {
        if (service) {
            db.selectFrom('exception')
                .selectAll()
                .where('service_id', '=', service.service_id)
                .execute()
                .then(setExceptions)
        }
    }, [service]);

    useEffect(() => {
        (new TripStopRepository()
            .findByTrip(match.params.id)).then(setTripStops)
    }, [match.params.id]);


    const date = setSeconds(new Date(), 0);
    const weekdays = []

    if (service?.monday) {
        weekdays.push('Mo.')
    }

    if (service?.tuesday) {
        weekdays.push('Di.')
    }

    if (service?.wednesday) {
        weekdays.push('Mi.')
    }

    if (service?.thursday) {
        weekdays.push('Do.')
    }

    if (service?.friday) {
        weekdays.push('Fr.')
    }

    if (service?.saturday) {
        weekdays.push('Sa.')
    }

    if (service?.sunday) {
        weekdays.push('So.')
    }

    const additional_dates = trip ? extractExceptions(exceptions, ExceptionType.RUNNING) : [];
    const exception_dates = trip ? extractExceptions(exceptions, ExceptionType.NOT_RUNNING) : [];
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                    </IonButtons>
                    <IonTitle>{trip ? <TripName trip={trip}/> : null}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent color="light">
                <IonList>
                    {tripStops?.map(tripStop => <IonItem
                        routerLink={`/connections/${tripStop.trip_stop_id}`}
                        key={tripStop.trip_stop_id}>
                        <IonLabel>
                            <IonNote>
                                {tripStop.arrival_time !== null ? formatDisplayTime(tripStop.arrival_time, date) : null}
                                {tripStop.arrival_time !== null && tripStop.departure_time !== null ? " - " : null}
                                {tripStop.departure_time !== null ? formatDisplayTime(tripStop.departure_time, date) : null}
                            </IonNote>
                            <IonText style={{display: 'block'}}>
                                {tripStop?.stop_name}{tripStop?.platform ? <>:
                                Steig {tripStop.platform}</> : null}
                            </IonText>
                            {tripStop.boarding !== Boarding.STANDARD ?
                                <IonNote color="warning" style={{display: 'block', fontWeight: 'bold'}}>
                                    <StopBoarding boarding={tripStop.boarding}/>
                                </IonNote> : null}
                        </IonLabel>
                    </IonItem>)}
                </IonList>
                {weekdays.length ?
                    <IonNote className="ion-margin" color="medium" style={{display: 'block'}}>
                        Verkehrt:<br/>{weekdays.join(', ')}
                    </IonNote> : null}
                {exception_dates.length ?
                    <IonNote className="ion-margin" color="medium" style={{display: 'block'}}>
                        Ausgenommen:<br/>{exception_dates.map(date => date.toLocaleDateString()).join(', ')}
                    </IonNote> : null}
                {additional_dates.length ?
                    <IonNote className="ion-margin" color="medium" style={{display: 'block'}}>
                        Zusätzlich:<br/>{additional_dates.map(date => date.toLocaleDateString()).join(', ')}
                    </IonNote> : null}
            </IonContent>
        </IonPage>
    );
};

export default Trip;
