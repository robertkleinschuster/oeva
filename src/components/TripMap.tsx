import React, {useEffect, useState} from "react";
import {MapContainer, Marker, Polyline, TileLayer} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import './map.css'
import {Icon} from "leaflet";
import locate from "ionicons/dist/svg/locate.svg"
import {useLiveQuery} from "dexie-react-hooks";
import {GTFSDB} from "../db/GTFSDB";
import {Trip} from "../db/Schedule";

const TripMap: React.FC<{ trip: Trip }> = ({trip}) => {
    const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | undefined>()

    useEffect(() => {
        const watchId = navigator.geolocation
            .watchPosition(position => {
                setCurrentPosition(position)
            }, console.error, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            })
        return () => navigator.geolocation.clearWatch(watchId)
    }, []);

    const shapes = useLiveQuery(async () => {
        const gtfsDb = new GTFSDB(trip.feed_id);
        const gtfsTrip = await gtfsDb.trips.get(trip.feed_trip_id)
        if (gtfsTrip?.shape_id) {
            return gtfsDb.shapes.where({shape_id: gtfsTrip.shape_id}).toArray()
        }
        return Promise.resolve(undefined)
    })


    return shapes?.length ? <MapContainer
        center={{lat: shapes[0].shape_pt_lat, lng: shapes[0].shape_pt_lon}}
        zoom={13}
        scrollWheelZoom={false}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shapes?.length ?
            <Polyline positions={shapes.map(shape => ({lat: shape.shape_pt_lat, lng: shape.shape_pt_lon}))}/> : null}
        {currentPosition ? <Marker
            position={{
                lat: currentPosition.coords.latitude,
                lng: currentPosition.coords.longitude,
            }}
            icon={new Icon({
                iconUrl: locate,
                iconSize: [20, 20],
            })}
        /> : null}


    </MapContainer> : <></>
}

export default TripMap