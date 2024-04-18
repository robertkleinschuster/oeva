import React, {useEffect, useState} from "react";
import {MapContainer, Marker, Polyline, TileLayer, Tooltip} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import './map.css'
import {Icon} from "leaflet";
import locate from "ionicons/dist/svg/locate.svg"
import {TripStop} from "../db/Schedule";
import {cellToLatLng} from "h3-js";
import haltestelle from "./haltestelle.svg";

const TripMap: React.FC<{ tripStops: TripStop[] }> = ({tripStops}) => {
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

    if (!tripStops.length) {
        return <></>
    }

    return <MapContainer
        center={cellToLatLng([tripStops[0].h3_cell_le1, tripStops[0].h3_cell_le2])}
        zoom={10}
        scrollWheelZoom={false}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={tripStops.map(tripStop => cellToLatLng([tripStop.h3_cell_le1, tripStop.h3_cell_le2]))}
                  pathOptions={{color: 'blue'}}/>
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
        {tripStops.map(tripStop =>
        <Marker
            position={cellToLatLng([tripStop.h3_cell_le1, tripStop.h3_cell_le2])}
            icon={new Icon({
                iconUrl: haltestelle,
                iconSize: [20, 20]
            })}
        ><Tooltip>{tripStop.stop?.name}</Tooltip></Marker>)}

    </MapContainer>
}

export default TripMap