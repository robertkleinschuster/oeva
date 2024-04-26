import {
    IonAccordion,
    IonAccordionGroup,
    IonBackButton,
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
import React, {useState} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {searchStop} from "../transit/StopSearch";
import {scheduleDB} from "../db/ScheduleDB";
import NearbyStops from "../components/NearbyStops";
import RecentStops from "../components/RecentStops";

const StopSearch: React.FC = () => {
        const [keyword, setKeyword] = useState('')
        const [loading, setLoading] = useState(false)
        const [accordion, setAccordion] = useState<string[]>(['recent'])
        const [prevAccordion, setPrevAccordion] = useState<string[]>(accordion)
        const stops = useLiveQuery(async () => {
                if (keyword.length > 1) {
                    setLoading(true)
                    const stops = await searchStop(keyword)
                    setAccordion([...accordion, 'search'])
                    setLoading(false)
                    return stops;
                }
                setLoading(false)
                setAccordion(prevAccordion)
                return Promise.resolve(undefined)
            }, [keyword]
        )

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
                            onIonInput={e => setKeyword(String(e.detail.value))}
                        />
                    </form>
                    <IonAccordionGroup multiple onIonChange={e => {
                        setAccordion(e.detail.value)
                        setPrevAccordion(e.detail.value)
                    }} value={accordion}>
                        <IonAccordion value="search" toggleIconSlot="start">
                            <IonItem slot="header">
                                <IonLabel>Suchergebnisse</IonLabel>
                            </IonItem>
                            <div slot="content">
                                <IonList>
                                    {stops?.length ? stops.map(stop => <IonItem
                                            routerLink={`/stops/${stop.id}`}
                                            onClick={() => {
                                                scheduleDB.stop.update(stop, {last_used: -(new Date).getTime()})
                                            }}
                                            key={stop.id}>
                                            <IonLabel>
                                                {stop.name}{stop.platform ? <>: Steig {stop.platform}</> : null}
                                                <IonNote> ({stop.feed_name})</IonNote>
                                            </IonLabel>
                                        </IonItem>
                                    ) : <IonItem><IonLabel
                                        color="medium">{keyword ? `Es wurde keine Station für deinen Suchbegriff „${keyword}“ gefunden.` : 'Gib den Namen einer Station in das Suchfeld ein.'}</IonLabel></IonItem>}
                                </IonList>
                            </div>
                        </IonAccordion>
                        <IonAccordion value="recent" toggleIconSlot="start">
                            <IonItem slot="header">
                                <IonLabel>Zuletzt verwendet</IonLabel>
                            </IonItem>
                            <div slot="content">
                                <RecentStops/>
                            </div>
                        </IonAccordion>
                        <IonAccordion value="nearby" toggleIconSlot="start">
                            <IonItem slot="header">
                                <IonLabel>In der Nähe</IonLabel>
                            </IonItem>
                            <div slot="content">
                                <NearbyStops/>
                            </div>
                        </IonAccordion>
                    </IonAccordionGroup>
                </IonContent>
            </IonPage>
        );
    }
;

export default StopSearch;
