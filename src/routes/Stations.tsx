import {Trips} from "../components/Trips.tsx";
import {TripDetail, TripDetailRepository} from "../transit/TripDetailRepository.ts";
import {useEffect, useState} from "react";
import {Navbar, Page} from "framework7-react";
import {transitDB} from "../db/TransitDB.ts";

export const Stations = () => {
    const [trips, setTrips] = useState<TripDetail[]>([])

    useEffect(() => {
        transitDB.stops.where('stop_name').startsWith("Graz Hbf").primaryKeys().then(stopIds => {
            const repo = new TripDetailRepository();
            repo.findByStops(stopIds, new Date())
                .then(setTrips);
        })

    }, []);

    return <Page>
        <Navbar title="Stationen" backLink/>
        <Trips trips={trips.filter(trip => trip.departure)}/>
    </Page>
}