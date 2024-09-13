import React, {createContext, ReactNode, useEffect, useState} from "react";
import {FeedRunner} from "./import/FeedRunner";
import {IonItem, IonLabel, IonSpinner} from "@ionic/react";

export const RunnerContext = createContext<[number|undefined, string]>([undefined, ''])

export const RunnerContextProvider: React.FC<{ children: ReactNode, runner: FeedRunner }> = ({children, runner}) => {
    const [running, setRunning] = useState<[number|undefined, string]>([undefined, ''])
    useEffect(() => {
        runner.onRun = (id: number, progress: string) => setRunning([id, progress])
        runner.onFinished = () => setRunning([undefined, ''])
    }, [runner]);

    const [runningId] = running

    return <RunnerContext.Provider value={running}>
        {runningId ? <IonItem color="light" style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            zIndex: 1,
            width: 'calc(100% - 2rem)',
            margin: '1rem',
            borderRadius: '.5rem'
        }}>
            <IonSpinner slot="end"/>
            <IonLabel>
                Feeds werden aktualisiert
            </IonLabel>
        </IonItem> : null}

        {children}
    </RunnerContext.Provider>
}
