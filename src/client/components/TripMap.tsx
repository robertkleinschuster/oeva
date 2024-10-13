import React, {useEffect, useState} from "react";
import {MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvent} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import './map.css'
import {Icon} from "leaflet";
import locate from "ionicons/dist/svg/locate.svg"
import {FullTripStop, Trip} from "../../shared/db/schema";
import {cellToLatLng} from "h3-js";
import haltestelle from "./haltestelle.svg";
import {IonButton, IonIcon, IonItem, IonRouterLink} from "@ionic/react";
import {chevronCollapse, chevronExpand} from "ionicons/icons";
import {formatDisplayTime} from "../../shared/DateTime";
import {RouteType} from "../../shared/db/enums";

const TripPolyline: React.FC<{ trip: Trip, tripStops: FullTripStop[] }> = ({trip, tripStops}) => {
    const colors = new Map([
        [RouteType.BUS, 'darkblue'],
        [RouteType.TROLLEYBUS, 'darkred'],
        [RouteType.TRAM, 'darkorange'],
        [RouteType.SUBWAY, 'darkgreen'],
        [RouteType.FUNICULAR, 'darkgray'],
    ])

    const map = useMap()
    return <Polyline positions={tripStops.map(tripStop => cellToLatLng(tripStop.h3_cell))}
                     pathOptions={{color: colors.get(trip.route_type) ?? 'black'}}
                     eventHandlers={{
                         add: e => {
                             map.fitBounds(e.target.getBounds())
                         }
                     }}
    />
}

const TripMarker: React.FC<{ tripStops: FullTripStop[] }> = ({tripStops}) => {
    const map = useMap()
    const [visibleStops, setVisibleStops] = useState<FullTripStop[]>([])
    const handleBoundsChange = () => {
        if (map.getZoom() > 10) {
            const visibleStops: FullTripStop[] = [];
            tripStops.forEach(tripStop => {
                const position = cellToLatLng(tripStop.h3_cell);
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

    return visibleStops.map(tripStop =>
        <Marker
            key={tripStop.trip_stop_id}
            position={cellToLatLng(tripStop.h3_cell)}
            icon={new Icon({
                iconUrl: haltestelle,
                iconSize: [20, 20]
            })}
        >
            <Popup>
                <p>
                    {tripStop?.stop_name}
                    {tripStop?.platform ? <>: Steig {tripStop.platform}</> : null}
                </p>
                <p>
                    {tripStop.arrival_time !== null ? formatDisplayTime(tripStop.arrival_time, new Date) : null}
                    {tripStop.arrival_time !== null && tripStop.departure_time !== null ? " - " : null}
                    {tripStop.departure_time !== null ? formatDisplayTime(tripStop.departure_time, new Date) : null}
                </p>
                <p>
                    <IonRouterLink routerLink={`/connections/${tripStop.trip_stop_id}`}>Anschlüsse</IonRouterLink>
                </p>
            </Popup>
        </Marker>)
}

const SizeInvalidator: React.FC<{ expanded: boolean }> = ({expanded}) => {
    const map = useMap()
    useEffect(() => {
        map.invalidateSize()
    }, [expanded]);
    return <></>
}

const TripMap: React.FC<{ trip: Trip, tripStops: FullTripStop[] }> = ({trip, tripStops}) => {
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
            <MapContainer center={cellToLatLng(tripStops[0].h3_cell)}
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