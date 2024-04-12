import {routeTypeNames, Stop, TripStop} from "../db/Schedule";
import {formatDisplayTime} from "../transit/DateTime";
import {IonItem, IonLabel, IonList, IonNote, IonText} from "@ionic/react";
import React from "react";
import {calcDistance} from "../transit/Geo";
import TripName from "./TripName";

export const Trips: React.FC<{ stop: Stop, tripStops: TripStop[], date: Date }> = ({stop, tripStops, date}) => (
    <IonList>
        {tripStops?.map(tripStop => <IonItem
            routerLink={`/trips/${tripStop.trip_id}`}
            key={tripStop.id}>
            <IonLabel>
                <IonNote>
                    {tripStop.departure_time === undefined ? 'Ankunft: ' : null}
                    {tripStop.arrival_time !== undefined ? formatDisplayTime(tripStop.arrival_time, date) : null}
                    {tripStop.arrival_time !== undefined && tripStop.departure_time !== undefined ? " - " : null}
                    {tripStop.departure_time !== undefined ? formatDisplayTime(tripStop.departure_time, date) : null}
                </IonNote>
                <IonText color={tripStop.departure_time === undefined ? 'medium' : undefined}
                         style={{display: 'block'}}>
                    {tripStop.trip ? <TripName trip={tripStop.trip}/> : null}
                </IonText>
                <IonNote color="medium" style={{display: 'block'}}>
                    {tripStop.stop?.name !== stop?.name ? <>{tripStop.stop?.name}</> : null}
                    {tripStop.stop?.name !== stop?.name && tripStop.stop?.platform ? ': ' : ''}
                    {tripStop.stop?.platform ? <>Steig {tripStop.stop.platform}</> : null}
                    {stop && (stop.feed_parent_station || tripStop.stop?.name !== stop.name) ? <> ({calcDistance([stop.h3_cell_le1, stop.h3_cell_le2], [tripStop.h3_cell_le1, tripStop.h3_cell_le2])} m)</> : ''}
                </IonNote>
            </IonLabel>
        </IonItem>)}
    </IonList>
)