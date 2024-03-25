import {useEffect, useState} from "react";
import {StopoverRepository} from "../transit/StopoverRepository.ts";
import {Block, BlockTitle, Navbar, Page} from "framework7-react";
import {Stopover} from "../db/Schedule.ts";
import {Trip as TripType} from "../db/Transit.ts"

export const Trip = ({tripId}: {tripId: string}) =>{
    const [trip, setTrip] = useState<TripType>()
    const [stopovers, setStopovers] = useState<Stopover[]>()
    useEffect(() => {
        const repo = new StopoverRepository()
        repo.findTrip(tripId).then(setTrip)
        repo.findByTrip(tripId, new Date()).then(setStopovers)
    }, []);

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
                {stopovers?.map(stop => <div className="timeline-item">
                        <div className="timeline-item-date">
                            {stop.arrival_time}
                            <br/>
                            {stop.departure_time}
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