import {
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
import React, {useEffect, useState} from "react";
import {useLiveQuery} from "dexie-react-hooks";
import {searchStop} from "../transit/StopSearch";

const StopSearch: React.FC = () => {
        const [keyword, setKeyword] = useState('')
        const [loading, setLoading] = useState(false)

        const stops = useLiveQuery(async () => {
                if (keyword.length > 1) {
                    return searchStop(keyword)
                }
                return Promise.resolve(undefined)
            }, [keyword]
        )

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
                                </IonLabel>
                                <IonNote slot="end">
                                    {stop.feed_name}
                                </IonNote>
                            </IonItem>
                        )}
                    </IonList>
                </IonContent>
            </IonPage>
        );
    }
;

export default StopSearch;
