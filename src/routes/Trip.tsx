import {useEffect, useState} from "react";
import {StopoverRepository} from "../transit/StopoverRepository.ts";
import {Block, BlockTitle, Navbar, Page} from "framework7-react";
import {Stopover} from "../db/Schedule.ts";
import {Trip as TripType} from "../db/GTFS.ts"
import {GTFSDB} from "../db/GTFSDB.ts";
import {parseStopTime} from "../transit/DateTime.ts";

export const Trip = ({tripId, feedId}: {tripId: string, feedId: number}) =>{
    const [trip, setTrip] = useState<TripType>()
    const [stopovers, setStopovers] = useState<Stopover[]>()
    const date = new Date();
    useEffect(() => {
        const transitDB = new GTFSDB(feedId)
        const repo = new StopoverRepository()
        transitDB.trips.get(tripId).then(setTrip)
        repo.findByTrip(tripId).then(setStopovers)
    }, [tripId]);

    if (!trip) {
        return <Page>
            Trip nicht gefunden.
        </Page>
    }

    return <Page>
        <Navbar title={trip.trip_short_name} backLink/>
        <BlockTitle>{trip.trip_short_name} {trip.trip_headsign}</BlockTitle>
        <Block strong inset>
            <div className="timeline">
                {stopovers?.map(stop => <div className="timeline-item" key={stop.sequence_in_trip}>
                        <div className="timeline-item-date">
                            {stop.arrival_time ? parseStopTime(stop.arrival_time, date).toLocaleTimeString() : null}
                            <br/>
                            {stop.departure_time ? parseStopTime(stop.departure_time, date).toLocaleTimeString() : null}
                        </div>
                        <div className="timeline-item-divider"></div>
                        <div className="timeline-item-content">
                            {stop.station}
                        </div>
                    </div>
                )}
            </div>
        </Block>
    </Page>
}