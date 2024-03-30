import {Stopover} from "../db/Schedule";
import {parseStopTime} from "../transit/DateTime";
import {IonItem, IonList} from "@ionic/react";
import React from "react";

export const Trips: React.FC<{ stopovers: Stopover[], date: Date }> = ({stopovers, date}) => (
    <IonList>
        {stopovers.map(stopover => <IonItem
                key={stopover.trip_id}
                routerLink={`/trip/${stopover.trip_id}`}
            >
                {stopover.departure_time ? parseStopTime(stopover.departure_time, date).toLocaleTimeString() : null} {stopover.line} {stopover.direction}
            </IonItem>
        )}
    </IonList>
)