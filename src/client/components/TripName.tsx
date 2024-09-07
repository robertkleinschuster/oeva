import React from "react";
import {routeTypeNames, Trip} from "../db/Schedule";
import {IonNote} from "@ionic/react";

const TripName: React.FC<{ trip: Trip, isDestination?: boolean }> = ({trip, isDestination = false}) => <>
    {routeTypeNames.get(trip.route_type)}
    {" "}
    {trip.line && trip.category && trip.line.startsWith(trip.category) ?
        <>{trip.line}{trip.number ? <IonNote color="medium"> {trip.number}</IonNote> : null}</>
        : (trip.name && trip.number && trip.name.endsWith(trip.number)
            ? <>{trip.name}{trip.line ? <IonNote color="medium"> {trip.line}</IonNote> : null}</>
            : (trip.line ? <>{trip.line}<IonNote color="medium"> {trip.name}</IonNote></> : <>{trip.name}</>))
    }
    {" "}
    {isDestination ? trip.origin : (trip.direction ? trip.direction : trip.destination)}
    <IonNote> ({trip.feed_name})</IonNote>
</>

export default TripName