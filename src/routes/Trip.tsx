import {useEffect, useState} from "react";
import {TripDetail, TripDetailRepository} from "../transit/TripDetailRepository.ts";
import {Block, BlockTitle, Navbar, Page} from "framework7-react";

export const Trip = ({tripId}: {tripId: string}) =>{
    const [trip, setTrip] = useState<TripDetail>()
    useEffect(() => {
        const repo = new TripDetailRepository()
        repo.findById(tripId, new Date()).then(setTrip)
    }, []);

    if (!trip) {
        return <Page>
            Trip nicht gefunden.
        </Page>
    }

    return <Page>
        <Navbar title={trip.trip.trip_short_name} backLink/>
        <BlockTitle>{trip.trip.trip_short_name} {trip.trip.trip_headsign}</BlockTitle>
        <Block strong inset>
            <div className="timeline">
                {trip.stops?.map(stop => <div className="timeline-item">
                        <div className="timeline-item-date">
                            {stop.arrival?.toLocaleTimeString()}
                            <br/>
                            {stop.departure?.toLocaleTimeString()}
                        </div>
                        <div className="timeline-item-divider"></div>
                        <div className="timeline-item-content">
                            {stop.stop.stop_name}
                        </div>
                    </div>
                )}
            </div>
        </Block>
    </Page>
}