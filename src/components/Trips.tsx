import {List, ListItem} from "framework7-react";
import {Stopover} from "../db/Schedule.ts";

export const Trips = ({stopovers}: { stopovers: Stopover[] }) => {
    return <List strong inset dividers>
        {stopovers.map(stopover => <ListItem
                key={stopover.trip_id}
                link={`/trip/${stopover.trip_id}`}
            >
                {stopover.departure_time} {stopover.line} {stopover.direction}
            </ListItem>
        )}
    </List>
}