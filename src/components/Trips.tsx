import {List, ListItem} from "framework7-react";
import {TripDetail} from "../transit/TripDetailRepository.ts";

export const Trips = ({trips}: {trips: TripDetail[]}) => {
    return <List strong inset dividers>
        {trips.map(trip => <ListItem key={trip.trip.trip_id}>{trip.departure?.toLocaleString()}: {trip.trip.trip_short_name} {trip.trip.trip_headsign}</ListItem>)}
    </List>
}