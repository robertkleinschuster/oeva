import {useState, useEffect} from 'react';
import {db, Routes, Stops, StopTimes, Trips} from './GTFSDB'; // Adjust the import path to your GTFSDB instance

interface Departure extends StopTimes {
    trip?: Trips,
    route?: Routes,
}

const StationSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [stations, setStations] = useState<Stops[]>([]);
    const [selectedStation, setSelectedStation] = useState<Stops | null>(null);
    const [departures, setDepartures] = useState<Departure[]>([]);

    useEffect(() => {
        if (searchTerm.length > 1) { // Trigger search after at least 2 characters
            const search = async () => {
                const foundStations = await db.stops
                    .where('stop_name')
                    .startsWithIgnoreCase(searchTerm)
                    .toArray();
                setStations(foundStations);
            };

            search();
        } else {
            setStations([]);
        }
    }, [searchTerm]);

    const handleSelectStation = async (station: Stops) => {
        setSelectedStation(station);
        const stationDepartures = await db.stopTimes
            .where('stop_id')
            .equals(station.stop_id)
            .sortBy('departure_time');

        // Assuming you want to join data from trips and routes tables to get more details
        // This is a simplistic approach; you might need to adjust based on your schema and required data
        const departuresWithDetails = await Promise.all(stationDepartures.map(async (departure) => {
            const trip = await db.trips.get(departure.trip_id);
            const route = trip ? await db.routes.get(trip.route_id) : undefined;
            return {...departure, trip, route};
        }));

        setDepartures(departuresWithDetails);
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Search for a station..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {stations.map(station => (
                <div key={station.stop_id} onClick={() => handleSelectStation(station)}>
                    {station.stop_name}
                </div>
            ))}
            {selectedStation && (
                <div>
                    <h2>Departures for {selectedStation.stop_name}</h2>
                    <ul>
                        {departures.map((departure, index) => (
                            <li key={index}>
                                {departure.departure_time} - {departure.route?.route_long_name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default StationSearch;
