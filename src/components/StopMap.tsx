import React, {useEffect, useState} from "react";
import {cellToLatLng, H3IndexInput} from "h3-js";
import {MapContainer, Marker, TileLayer} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import './map.css'
import {Icon} from "leaflet";
import haltestelle from "./haltestelle.svg"
import locate from "ionicons/dist/svg/locate.svg"
const StopMap: React.FC<{ cell: H3IndexInput }> = ({cell}) => {
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


    const position = cellToLatLng(cell);
    return <MapContainer center={position} zoom={13} scrollWheelZoom={false}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
            position={position}
            icon={new Icon({
                iconUrl: haltestelle,
                iconSize: [25, 25],
                className: 'pulse'
            })}
        />
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


    </MapContainer>
}

export default StopMap