import React from "react";
import {routeTypeNames} from "../db/Schedule";
import {IonNote} from "@ionic/react";
import {Trip} from "../db/schema";

const TripName: React.FC<{ trip: Trip, isDestination?: boolean }> = ({trip, isDestination = false}) => <>
    {routeTypeNames.get(trip.route_type)}
    {" "}
    {trip.line && trip.category && trip.line.startsWith(trip.category) ?
        <>{trip.line}{trip.number ? <IonNote color="medium"> {trip.number}</IonNote> : null}</>
        : (trip.trip_name && trip.number && trip.trip_name.endsWith(trip.number)
            ? <>{trip.trip_name}{trip.line ? <IonNote color="medium"> {trip.line}</IonNote> : null}</>
            : (trip.line ? <>{trip.line}<IonNote color="medium"> {trip.trip_name}</IonNote></> : <>{trip.trip_name}</>))
    }
    {" "}
    {!isDestination ? trip.direction : ''}
    <IonNote> ({trip.feed_name})</IonNote>
</>

export default TripName