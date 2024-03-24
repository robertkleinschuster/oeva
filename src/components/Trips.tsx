import {List, ListItem} from "framework7-react";
import {TripAtStop} from "../transit/TripDetailRepository.ts";

export const Trips = ({trips}: { trips: TripAtStop[] }) => {
    return <List strong inset dividers>
        {trips.map(trip => <ListItem
                key={trip.trip.trip_id}
                link={`/trip/${trip.trip.trip_id}`}
            >
                {trip.departure?.toLocaleString()}: {trip.trip.trip_short_name} {trip.trip.trip_headsign}
            </ListItem>
        )}
    </List>
}