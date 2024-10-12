import {Boarding} from "../db/Schedule";
import {FullTripStop, Stop, TripStop} from "../db/schema";
import {formatDisplayTime, parseStopTimeInt} from "../transit/DateTime";
import {IonIcon, IonItem, IonLabel, IonList, IonNote, IonText} from "@ionic/react";
import React from "react";
import {calcDistance} from "../transit/Geo";
import TripName from "./TripName";
import StopBoarding from "./StopBoarding";
import {closeOutline, ellipse, hourglassOutline} from "ionicons/icons";
import {addMinutes} from "date-fns";

const State: React.FC<{ tripStop: TripStop, date: Date }> = ({tripStop, date}) => {
    if (tripStop.departure_time) {
        if (parseStopTimeInt(tripStop.departure_time, date) < new Date()) {
            return <IonIcon icon={closeOutline} slot="start"/>
        }
        if (parseStopTimeInt(tripStop.departure_time, date) < addMinutes(new Date(), 10)) {
            return <IonIcon icon={hourglassOutline} slot="start" color="warning"/>
        }
        return <IonIcon icon={ellipse} slot="start" color="primary"/>
    }

    return <></>
}

export const Trips: React.FC<{ stop: Stop, tripStops: FullTripStop[], date: Date }> = ({stop, tripStops, date}) => (
    <IonList>
        {tripStops?.map(tripStop => <IonItem
            routerLink={`/trips/${tripStop.trip_id}`}
            key={tripStop.trip_stop_id}>
            <State tripStop={tripStop} date={date}/>
            <IonText slot="start">
                {tripStop.departure_time !== null ? formatDisplayTime(tripStop.departure_time, date) : null}
                {tripStop.departure_time === null && tripStop.arrival_time !== null ? <>
                    An. {formatDisplayTime(tripStop.arrival_time, date)}
                </> : null}
            </IonText>
            <IonLabel>
                {tripStop.departure_time !== null && tripStop.arrival_time !== null && tripStop.departure_time !== tripStop.arrival_time ?
                    <IonNote>
                        An. {formatDisplayTime(tripStop.arrival_time, date)}
                    </IonNote> : null}
                <IonText color={tripStop.is_destination ? 'medium' : undefined}
                         style={{display: 'block'}}>
                    {tripStop ? <TripName trip={tripStop} isDestination={tripStop.is_destination}/> : null}
                </IonText>
                <IonNote color="medium" style={{display: 'block'}}>
                    {tripStop?.stop_name !== stop?.stop_name ? <>{tripStop?.stop_name}</> : null}
                    {tripStop?.stop_name !== stop?.stop_name && tripStop?.platform ? ': ' : ''}
                    {tripStop?.platform ? <>Steig {tripStop.platform}</> : null}
                    {stop && (stop.feed_parent_station || tripStop?.stop_name !== stop.stop_name) ? <> ({calcDistance(stop.h3_cell, tripStop.h3_cell)} m)</> : ''}
                </IonNote>
                {tripStop.boarding !== Boarding.STANDARD ?
                    <IonNote color="warning" style={{display: 'block', fontWeight: 'bold'}}>
                        <StopBoarding boarding={tripStop.boarding}/>
                    </IonNote> : null}
            </IonLabel>
        </IonItem>)}
    </IonList>
)