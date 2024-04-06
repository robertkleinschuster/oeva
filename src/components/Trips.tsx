import {TripStop} from "../db/Schedule";
import {parseStopTimeInt} from "../transit/DateTime";
import {IonItem, IonList} from "@ionic/react";
import React from "react";

export const Trips: React.FC<{ tripStops: TripStop[], date: Date }> = ({tripStops, date}) => (
    <IonList>
        {tripStops.map(tripStop => <IonItem
                key={tripStop.trip_id}
                routerLink={`/trip/${tripStop.trip_id}`}
            >
                {tripStop.departure_time !== undefined ? parseStopTimeInt(tripStop.departure_time, date).toLocaleTimeString() : null} {tripStop.trip_name} {tripStop.direction}
            </IonItem>
        )}
    </IonList>
)