import React, {useEffect, useState} from "react";
import {cellToLatLng, H3IndexInput} from "h3-js";
import {CircleMarker, MapContainer, Marker, Popup, TileLayer} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import './map.css'

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
        <Marker position={position}/>
        {currentPosition ? <CircleMarker
            center={{
                lat: currentPosition.coords.latitude,
                lng: currentPosition.coords.longitude,
            }}
            radius={15}
            pathOptions={{
                color: '#fff',
                fillColor: '#17769d',
                fillOpacity: .8,
            }}
        /> : null}


    </MapContainer>
}

export default StopMap