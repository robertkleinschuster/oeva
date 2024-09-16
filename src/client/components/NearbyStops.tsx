import React, {useEffect, useState} from "react";
import {IonItem, IonLabel, IonList, IonNote} from "@ionic/react";
import {calcDistance} from "../transit/Geo";
import {H3_RESOLUTION} from "../db/Schedule";
import {H3Cell} from "../transit/H3Cell";
import {gridDisk, latLngToCell} from "h3-js";
import {db} from "../db/client";
import {Stop} from "../db/schema";

interface NearbyStop extends Stop {
    distance: number
}

const NearbyStops: React.FC = () => {
    const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([])

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(async (position) => {
                const currentCell = latLngToCell(position.coords.latitude, position.coords.longitude, H3_RESOLUTION);
                const cells = gridDisk(currentCell, 26).map(c => {
                    const cell = new H3Cell()
                    cell.fromIndex(c)
                    return cell.toIndexInput()
                });
                const stops = new Map<string, NearbyStop>()
                for (const cell of cells) {
                    (await db.selectFrom('stop')
                        .selectAll()
                        .where('h3_cell_le1', '=', Number(cell[0]))
                        .where('h3_cell_le2', '=', Number(cell[1]))
                        .where('feed_parent_station', 'is', null)
                        .execute())
                        .forEach(stop => {
                            stops.set(
                                stop.stop_name + stop.platform,
                                {
                                    ...stop,
                                    distance: calcDistance(currentCell, [stop.h3_cell_le1, stop.h3_cell_le2])
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