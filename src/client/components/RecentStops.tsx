import {IonItem, IonLabel, IonList, IonNote} from "@ionic/react";
import React, {useEffect, useState} from "react";
import {Stop} from "../../shared/db/schema";
import {db} from "../db/client";

const RecentStops: React.FC = () => {
    const [stops, setStops] = useState<Stop[]>([]);

    useEffect(() => {
        db.selectFrom('stop')
            .selectAll()
            .where('last_used', 'is not', null)
            .orderBy('last_used')
            .limit(10)
            .execute()
            .then(setStops)
    }, []);

    return <IonList>
        {stops?.length ? stops.map(stop => <IonItem
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
                </IonLabel>
            </IonItem>
        ) : <IonItem><IonLabel color="medium">Hier erscheinen bis zu 10 deiner zuletzt gesuchten und geöffneten
            Stationen.</IonLabel></IonItem>}
    </IonList>
}

export default RecentStops