import {TripStop} from "../db/Schedule";
import {parseStopTime} from "../transit/DateTime";
import {IonItem, IonList} from "@ionic/react";
import React from "react";

export const Trips: React.FC<{ tripStops: TripStop[], date: Date }> = ({tripStops, date}) => (
    <IonList>
        {tripStops.map(tripStop => <IonItem
                key={tripStop.trip_id}
                routerLink={`/trip/${tripStop.trip_id}`}
            >
                {tripStop.departure_time ? parseStopTime(tripStop.departure_time, date).toLocaleTimeString() : null} {tripStop.line} {tripStop.direction}
            </IonItem>
        )}
    </IonList>
)