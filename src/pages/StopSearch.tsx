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

        const lastUsedStops = useLiveQuery(
            () => scheduleDB.stop.orderBy('last_used').limit(10).toArray(stops => stops.reverse())
        )

        useEffect(() => {
            const watchId = navigator.geolocation.watchPosition(async (position) => {
                const cell = new H3Cell()
                cell.fromIndex(latLngToCell(position.coords.latitude, position.coords.longitude, H3_RESOLUTION))
                const currentCell = cell.toIndexInput();
                setCurrentCell(currentCell)
                const cells = gridDisk(cell.toIndexInput(), 26).map(c => {
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
                                stops.set(stop.name + stop.platform, stop)
                            }
                        })
                }

                setNearbyStops(Array.from(stops.values())
                    .sort(
                        (a, b) =>
                            calcDistance([a.h3_cell_le1, a.h3_cell_le2], currentCell) - calcDistance([b.h3_cell_le1, b.h3_cell_le2], currentCell))
                )
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
                                onClick={() => {
                                    scheduleDB.stop.update(stop, {last_used: (new Date).getTime()})
                                }}
                                key={stop.id}>
                                <IonLabel>
                                    {stop.name}{stop.platform ? <>: Steig {stop.platform}</> : null}
                                    <IonNote> ({stop.feed_name})</IonNote>
                                </IonLabel>
                            </IonItem>
                        )}
                        {!stops && nearbyStops ? <IonNote color="medium" class="ion-margin" style={{display: 'block'}}>
                            In der Nähe
                        </IonNote> : null}
                        {!stops && !showNearby ? <IonButton fill="clear" onClick={() => {
                            navigator.permissions.query({name: "geolocation"}).then(value => {
                                if (value.state === 'prompt') {
                                    navigator.geolocation.getCurrentPosition(() => {
                                        setShowNearby(true)
                                    }, console.error)
                                } else {
                                    setShowNearby(value.state === 'granted')
                                }
                                value.onchange = (() => {
                                    setShowNearby(value.state === 'granted')
                                })
                            })
                        }}>Stationen in der Nähe anzeigen</IonButton> : null}
                        {!stops && currentCell ? nearbyStops.map(stop => <IonItem
                                routerLink={`/stops/${stop.id}`}
                                onClick={() => {
                                    scheduleDB.stop.update(stop, {last_used: (new Date).getTime()})
                                }}
                                key={stop.id}>
                                <IonLabel>
                                    {stop.name}{stop.platform ? <>: Steig {stop.platform}</> : null}
                                    <IonNote> ({stop.feed_name})</IonNote>
                                    <IonNote
                                        style={{display: 'block'}}>{calcDistance([stop.h3_cell_le1, stop.h3_cell_le2], currentCell)} m</IonNote>
                                </IonLabel>
                            </IonItem>
                        ) : null}
                        {!stops ?
                            <IonNote color="medium" class="ion-margin" style={{display: 'block'}}>
                                Zuletzt verwendet
                            </IonNote> : null}
                        {!stops && lastUsedStops?.map(stop => <IonItem
                                routerLink={`/stops/${stop.id}`}
                                onClick={() => {
                                    scheduleDB.stop.update(stop, {last_used: (new Date).getTime()})
                                }}
                                key={stop.id}>
                                <IonLabel>
                                    {stop.name}{stop.platform ? <>: Steig {stop.platform}</> : null}
                                    <IonNote> ({stop.feed_name})</IonNote>
                                    {currentCell ?
                                        <IonNote
                                            style={{display: 'block'}}>{calcDistance([stop.h3_cell_le1, stop.h3_cell_le2], currentCell)} m</IonNote> : null}
                                </IonLabel>
                            </IonItem>
                        )}
                    </IonList>
                </IonContent>
            </IonPage>
        );
    }
;

export default StopSearch;
