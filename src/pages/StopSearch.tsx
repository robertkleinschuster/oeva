import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonProgressBar,
    IonSearchbar,
    IonTitle,
    IonToolbar, isPlatform
} from '@ionic/react';
import React, {useEffect, useState} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {searchStop} from "../transit/StopSearch";
import {gridDisk, H3IndexInput, latLngToCell} from "h3-js";
import {H3_RESOLUTION, Stop, TripStop} from "../db/Schedule";
import {H3Cell} from "../transit/H3Cell";
import {scheduleDB} from "../db/ScheduleDB";
import {isTripStopActiveOn} from "../transit/Schedule";
import {calcDistance} from "../transit/Geo";
import TripName from "../components/TripName";
import {formatDisplayTime} from "../transit/DateTime";

const StopSearch: React.FC = () => {
        const [keyword, setKeyword] = useState('')
        const [loading, setLoading] = useState(false)
        const [showNearby, setShowNearby] = useState(false)
        const [nearbyStops, setNearbyStops] = useState<Stop[]>([])
        const [currentCell, setCurrentCell] = useState<H3IndexInput>()

        const stops = useLiveQuery(async () => {
                if (keyword.length > 1) {
                    return searchStop(keyword)
                }
                return Promise.resolve(undefined)
            }, [keyword]
        )

        useEffect(() => {
            const watchId = navigator.geolocation.watchPosition(async (position) => {
                const cell = new H3Cell()
                cell.fromIndex(latLngToCell(position.coords.latitude, position.coords.longitude, H3_RESOLUTION))
                setCurrentCell(cell.toIndexInput())
                const cells = gridDisk(cell.toIndexInput(), 14).map(c => {
                    cell.fromIndex(c)
                    return cell.toIndexInput()
                });

                const stops = new Map<string, Stop>()
                for (const cell of cells) {
                    await scheduleDB.stop
                        .where('[h3_cell_le1+h3_cell_le2]')
                        .equals(cell)
                        .each(stop => {
                            if (!stop.feed_parent_station) {
                                stops.set(stop.id, stop)
                            }
                        })
                }

                setNearbyStops(Array.from(stops.values()))
                if (!showNearby) {
                    setShowNearby(true)
                }
            }, undefined, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            });

            return () => navigator.geolocation.clearWatch(watchId)
        }, [showNearby]);

        useEffect(() => {
            setLoading(false)
        }, [stops]);

        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton text={isPlatform('ios') ? "OeVA" : undefined}/>
                        </IonButtons>
                        <IonTitle>Stationen</IonTitle>
                        {loading ? <IonProgressBar type="indeterminate"></IonProgressBar> : null}
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <form action="#" onSubmit={e => e.preventDefault()}>
                        <IonSearchbar
                            debounce={500}
                            placeholder="Suchen..."
                            inputmode="search"
                            onIonInput={e => {
                                setLoading(true)
                                setKeyword(String(e.detail.value))
                            }}
                        />
                    </form>
                    <IonList>
                        {stops?.map(stop => <IonItem
                                routerLink={`/stops/${stop.id}`}
                                key={stop.id}>
                                <IonLabel>
                                    {stop.name}{stop.platform ? <>: Steig {stop.platform}</> : null}
                                    <IonNote>({stop.feed_name})</IonNote>
                                </IonLabel>
                            </IonItem>
                        )}
                        {!stops && nearbyStops ? <IonNote color="medium" class="ion-margin" style={{display: 'block'}}>
                            In der Nähe:
                        </IonNote> : null}
                        {!showNearby ? <IonButton fill="clear" onClick={() => setShowNearby(true)}>Stationen in der Nähe anzeigen</IonButton> : null}
                        {!stops && currentCell ? nearbyStops.map(stop => <IonItem
                                routerLink={`/stops/${stop.id}`}
                                key={stop.id}>
                                <IonLabel>
                                    {stop.name}{stop.platform ? <>: Steig {stop.platform}</> : null}
                                    <IonNote> ({stop.feed_name})</IonNote>
                                    <IonNote
                                        style={{display: 'block'}}>{calcDistance([stop.h3_cell_le1, stop.h3_cell_le2], currentCell)} m</IonNote>
                                </IonLabel>
                            </IonItem>
                        ) : null}
                    </IonList>
                </IonContent>
            </IonPage>
        );
    }
;

export default StopSearch;
