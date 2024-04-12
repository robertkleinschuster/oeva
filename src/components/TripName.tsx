import React from "react";
import {routeTypeNames, Trip} from "../db/Schedule";
import {IonNote} from "@ionic/react";

const TripName: React.FC<{ trip: Trip }> = ({trip}) => <>
    {routeTypeNames.get(trip.route_type)}
    {" "}
    {trip.line && trip.category && trip.line.startsWith(trip.category) ?
        <>{trip.line}{trip.number ?
            <IonNote color="medium"> {trip.number}</IonNote> : null}</>
        : <>{trip.name}{trip.line ?
            <IonNote color="medium"> {trip.line}</IonNote> : null}</>
    }
    {" "}
    {trip.direction}
    <IonNote> ({trip.feed_name})</IonNote>
</>

export default TripName