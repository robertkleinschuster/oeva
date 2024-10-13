import React, {useEffect, useState} from "react";
import {IonItem, IonLabel, IonList, IonNote} from "@ionic/react";
import {calcDistance} from "../../shared/Geo";
import {H3_RESOLUTION} from "../../shared/db/enums";
import {gridDisk, latLngToCell} from "h3-js";
import {db} from "../db/client";
import {Stop} from "../../shared/db/schema";

interface NearbyStop extends Stop {
    distance: number
}

const NearbyStops: React.FC = () => {
    const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([])

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(async (position) => {
                const currentCell = latLngToCell(position.coords.latitude, position.coords.longitude, H3_RESOLUTION);
                const cells = gridDisk(currentCell, 26);
                const stops = new Map<string, NearbyStop>()
                for (const cell of cells) {
                    (await db.selectFrom('stop')
                        .selectAll()
                        .where('h3_cell', '=', cell)
                        .where('feed_parent_station', 'is', null)
                        .execute())
                        .forEach(stop => {
                            stops.set(
                                stop.stop_name + stop.platform,
                                {
                                    ...stop,
                                    distance: calcDistance(currentCell, stop.h3_cell)
                                }
                            )
                        })
                }

                setNearbyStops(Array.from(stops.values()).sort((a, b) => a.distance - b.distance))
            },
            console.error,
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            });

        return () => navigator.geolocation.clearWatch(watchId)
    }, []);

    return <IonList>
        {nearbyStops?.length ? nearbyStops.map(stop => <IonItem
                routerLink={`/stops/${stop.stop_id}`}
                onClick={() => {
                    db.updateTable('stop')
                        .set({last_used: -(new Date).getTime()})
                        .where('stop_id', '=', stop.stop_id)
                        .execute()
                }}
                key={stop.stop_id}>
                <IonLabel>
                    {stop.stop_name}{stop.platform ? <>: Steig {stop.platform}</> : null}
                    <IonNote> ({stop.feed_name})</IonNote>
                    <IonNote
                        style={{display: 'block'}}>{stop.distance} m</IonNote>
                </IonLabel>
            </IonItem>
        ) : <IonItem>
            <IonLabel color="medium">
                Es wurden keine Stationen in deiner Nähe gefunden.
                Vergewissere dich, dass du in den Einstellungen deines Browsers die Standortfreigabe für diese Domain
                aktiviert hast.
            </IonLabel>
        </IonItem>}
    </IonList>
}

export default NearbyStops