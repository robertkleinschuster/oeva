import {useLiveQuery} from "dexie-react-hooks";
import {scheduleDB} from "../db/ScheduleDB";
import {IonItem, IonLabel, IonList, IonNote} from "@ionic/react";
import React from "react";

const RecentStops: React.FC = () => {
    const lastUsedStops = useLiveQuery(
        () => scheduleDB.stop.orderBy('last_used').limit(10).toArray(stops => stops.reverse())
    )

    return <IonList>
        {lastUsedStops?.length ? lastUsedStops.map(stop => <IonItem
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
        ) : <IonItem><IonLabel color="medium">Hier erscheinen bis zu 10 deiner zuletzt gesuchten und geöffneten Stationen.</IonLabel></IonItem>}
    </IonList>
}

export default RecentStops