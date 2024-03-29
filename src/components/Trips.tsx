import {List, ListItem} from "framework7-react";
import {Stopover} from "../db/Schedule.ts";
import {parseStopTime} from "../transit/DateTime.ts";

export const Trips = ({stopovers, date}: { stopovers: Stopover[], date: Date }) => {
    return <List strong inset dividers>
        {stopovers.map(stopover => <ListItem
                key={stopover.trip_id}
                link={`/trip/${stopover.trip_id}`}
            >
                {stopover.departure_time ? parseStopTime(stopover.departure_time, date).toLocaleTimeString() : null} {stopover.line} {stopover.direction}
            </ListItem>
        )}
    </List>
}