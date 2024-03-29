import {useEffect, useState} from "react";
import {StopoverRepository} from "../transit/StopoverRepository.ts";
import {Block, Navbar, Page} from "framework7-react";
import {Stopover} from "../db/Schedule.ts";
import {Trip as TripType} from "../db/Schedule.ts"
import {parseStopTime} from "../transit/DateTime.ts";
import {scheduleDB} from "../db/ScheduleDB.ts";

export const Trip = ({tripId}: {tripId: string}) =>{
    const [trip, setTrip] = useState<TripType>()
    const [stopovers, setStopovers] = useState<Stopover[]>()
    const date = new Date();

    useEffect(() => {
        const repo = new StopoverRepository()
        scheduleDB.trip.get(tripId).then(setTrip)
        repo.findByTrip(tripId).then(setStopovers)
    }, [tripId]);

    if (!trip) {
        return <Page>
            Trip nicht gefunden.
        </Page>
    }

    return <Page>
        <Navbar title={trip.name} backLink/>
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