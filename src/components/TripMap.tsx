import React, {useEffect, useState} from "react";
import {MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvent} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import './map.css'
import {Icon} from "leaflet";
import locate from "ionicons/dist/svg/locate.svg"
import {RouteType, Trip, TripStop} from "../db/Schedule";
import {cellToLatLng} from "h3-js";
import haltestelle from "./haltestelle.svg";
import {IonButton, IonIcon, IonItem} from "@ionic/react";
import {chevronCollapse, chevronExpand} from "ionicons/icons";

const TripPolyline: React.FC<{ trip: Trip, tripStops: TripStop[] }> = ({trip, tripStops}) => {
    const colors = new Map([
        [RouteType.RAIL, 'darkred'],
        [RouteType.BUS, 'green'],
        [RouteType.TRAM, 'darkorange'],
    ])

    const map = useMap()
    return <Polyline positions={tripStops.map(tripStop => cellToLatLng([tripStop.h3_cell_le1, tripStop.h3_cell_le2]))}
                     pathOptions={{color: colors.get(trip.route_type) ?? 'blue'}}
                     eventHandlers={{
                         add: e => {
                             map.fitBounds(e.target.getBounds())
                         }
                     }}
    />
}

const TripMarker: React.FC<{ tripStops: TripStop[] }> = ({tripStops}) => {
    const map = useMap()
    const [visibleStops, setVisibleStops] = useState<TripStop[]>([])
    const handleBoundsChange = () => {
        if (map.getZoom() > 10) {
            const visibleStops: TripStop[] = [];
            tripStops.forEach(tripStop => {
                const position = cellToLatLng([tripStop.h3_cell_le1, tripStop.h3_cell_le2]);
                if (map.getBounds().contains(position)) {
                    visibleStops.push(tripStop);
                }
            });
            setVisibleStops(visibleStops)
        } else {
            setVisibleStops([])
        }
    }

    useMapEvent('zoom', handleBoundsChange)
    useMapEvent('move', handleBoundsChange)

    if (visibleStops.length > 15) {
        return <></>
    }

    if (visibleStops.length > 5) {
        return visibleStops.map(tripStop =>
            <Marker
                key={tripStop.id + '-hover'}
                position={cellToLatLng([tripStop.h3_cell_le1, tripStop.h3_cell_le2])}
                icon={new Icon({
                    iconUrl: haltestelle,
                    iconSize: [20, 20]
                })}
            ><Tooltip>{tripStop.stop?.name}</Tooltip></Marker>
        )
    }

    return visibleStops.map(tripStop =>
        <Marker
            key={tripStop.id}
            position={cellToLatLng([tripStop.h3_cell_le1, tripStop.h3_cell_le2])}
            icon={new Icon({
                iconUrl: haltestelle,
                iconSize: [20, 20]
            })}
        >
            <Tooltip permanent>{tripStop.stop?.name}</Tooltip>
        </Marker>)
}

const SizeInvalidator: React.FC<{ expanded: boolean }> = ({expanded}) => {
    const map = useMap()
    useEffect(() => {
        map.invalidateSize()
    }, [expanded]);
    return <></>
}

const TripMap: React.FC<{ trip: Trip, tripStops: TripStop[] }> = ({trip, tripStops}) => {
    const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | undefined>()
    const [expanded, setExpanded] = useState(false)
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

    return <>
        <div className={expanded ? 'expanded' : 'collapsed'}>
            <MapContainer center={cellToLatLng([tripStops[0].h3_cell_le1, tripStops[0].h3_cell_le2])}
                          zoom={10}
                          trackResize
                          doubleClickZoom={false}
                          scrollWheelZoom={false}>
                <SizeInvalidator expanded={expanded}/>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <TripPolyline trip={trip} tripStops={tripStops}/>
                <TripMarker tripStops={tripStops}/>
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
        </div>
        <IonItem>
            <IonButton slot="end" fill="clear" color="medium" onClick={() => setExpanded(!expanded)}>
                <IonIcon slot="icon-only" icon={expanded ? chevronCollapse : chevronExpand}/>
            </IonButton>
        </IonItem>
    </>
}

export default TripMap