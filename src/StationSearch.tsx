import {useState, useEffect} from 'react';
import {transitDB, Route, Stop, StopTime, Trip} from './TransitDB.ts';
import {Input} from "framework7-react";

interface Departure extends StopTime {
    trip?: Trip,
    route?: Route,
}

const StationSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [stations, setStations] = useState<Stop[]>([]);
    const [selectedStation, setSelectedStation] = useState<Stop | null>(null);
    const [departures, setDepartures] = useState<Departure[]>([]);

    useEffect(() => {
        if (searchTerm.length > 1) { // Trigger search after at least 2 characters
            const search = async () => {
                const foundStations = await transitDB.stops
                    .where('stop_name')
                    .startsWithIgnoreCase(searchTerm)
                    .toArray();
                setStations(foundStations);
                setSelectedStation(null)
            };

            search();
        } else {
            setStations([]);
        }
    }, [searchTerm]);

    const handleSelectStation = async (station: Stop) => {
        setSelectedStation(station);
        const stationDepartures = await transitDB.stopTimes
            .where('stop_id')
            .equals(station.stop_id)
            .sortBy('departure_time');

        // Assuming you want to join data from trips and routes tables to get more details
        // This is a simplistic approach; you might need to adjust based on your schema and required data
        const departuresWithDetails = await Promise.all(stationDepartures.map(async (departure) => {
            const trip = await transitDB.trips.get(departure.trip_id);
            const route = trip ? await transitDB.routes.get(trip.route_id) : undefined;
            return {...departure, trip, route};
        }));
        console.log(departuresWithDetails)
        setDepartures(departuresWithDetails);
    };

    return (
        <div>
            <Input
                type="text"
                placeholder="Search for a station..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {selectedStation ? (
                <div>
                    <h2>Departures for {selectedStation.stop_name}</h2>
                    <ul>
                        {departures.map((departure, index) => (
                            <li key={index}>
                                {departure.departure_time}:{departure.trip?.trip_headsign}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : stations.map(station => (
                <div key={station.stop_id} onClick={() => handleSelectStation(station)}>
                    {station.stop_name}
                </div>
            ))}
        </div>
    );
};

export default StationSearch;
