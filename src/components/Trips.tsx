import {Stop, TripStop} from "../db/Schedule";
import {formatDisplayTime} from "../transit/DateTime";
import {IonItem, IonLabel, IonList, IonNote, IonText} from "@ionic/react";
import React from "react";
import {calcDistance} from "../transit/Geo";

export const Trips: React.FC<{ stop: Stop, tripStops: TripStop[], date: Date }> = ({stop, tripStops, date}) => (
    <IonList>
        {tripStops?.map(tripStop => <IonItem
            routerLink={`/trips/${tripStop.trip_id}`}
            key={tripStop.id}>
            <IonLabel>
                <IonNote>
                    {tripStop.arrival_time !== undefined ? formatDisplayTime(tripStop.arrival_time, date) : null}
                    {tripStop.arrival_time !== undefined && tripStop.departure_time !== undefined ? " - " : null}
                    {tripStop.departure_time !== undefined ? formatDisplayTime(tripStop.departure_time, date) : null}
                </IonNote>
                <IonText style={{display: 'block'}}>
                    {tripStop.trip_name} {tripStop.direction} <IonNote>({tripStop.feed_name})</IonNote>
                </IonText>
                <IonNote color="medium" style={{display: 'block'}}>
                    {tripStop.stop_name !== stop?.name ? <>{tripStop.stop_name}</> : null}
                    {tripStop.stop_name !== stop?.name && tripStop.stop_platform ? ': ' : ''}
                    {tripStop.stop_platform ? <>Steig {tripStop.stop_platform}</> : null}
                    {stop && (stop.feed_parent_station || tripStop.stop_name !== stop.name) ? <> ({calcDistance([stop.h3_cell_le1, stop.h3_cell_le2], [tripStop.h3_cell_le1, tripStop.h3_cell_le2])} m)</> : ''}
                </IonNote>
            </IonLabel>
        </IonItem>)}
    </IonList>
)