import {Boarding, Stop, TripStop} from "../db/Schedule";
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

export const Trips: React.FC<{ stop: Stop, tripStops: TripStop[], date: Date }> = ({stop, tripStops, date}) => (
    <IonList>
        {tripStops?.map(tripStop => <IonItem
            routerLink={`/trips/${tripStop.trip_id}`}
            key={tripStop.id}>
            <State tripStop={tripStop} date={date}/>
            <IonText slot="start">
                {tripStop.departure_time !== undefined ? formatDisplayTime(tripStop.departure_time, date) : null}
                {tripStop.departure_time === undefined && tripStop.arrival_time !== undefined ? <>
                    An. {formatDisplayTime(tripStop.arrival_time, date)}
                </> : null}
            </IonText>
            <IonLabel>
                {tripStop.departure_time !== undefined && tripStop.arrival_time !== undefined && tripStop.departure_time !== tripStop.arrival_time ?
                    <IonNote>
                        An. {formatDisplayTime(tripStop.arrival_time, date)}
                    </IonNote> : null}
                <IonText color={tripStop.is_destination ? 'medium' : undefined}
                         style={{display: 'block'}}>
                    {tripStop.trip ? <TripName trip={tripStop.trip} isDestination={tripStop.is_destination}/> : null}
                </IonText>
                <IonNote color="medium" style={{display: 'block'}}>
                    {tripStop.stop?.name !== stop?.name ? <>{tripStop.stop?.name}</> : null}
                    {tripStop.stop?.name !== stop?.name && tripStop.stop?.platform ? ': ' : ''}
                    {tripStop.stop?.platform ? <>Steig {tripStop.stop.platform}</> : null}
                    {stop && (stop.feed_parent_station || tripStop.stop?.name !== stop.name) ? <> ({calcDistance([stop.h3_cell_le1, stop.h3_cell_le2], [tripStop.h3_cell_le1, tripStop.h3_cell_le2])} m)</> : ''}
                </IonNote>
                {tripStop.boarding !== Boarding.STANDARD ?
                    <IonNote color="warning" style={{display: 'block', fontWeight: 'bold'}}>
                        <StopBoarding boarding={tripStop.boarding}/>
                    </IonNote> : null}
            </IonLabel>
        </IonItem>)}
    </IonList>
)