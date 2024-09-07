import React, {createContext, ReactNode, useEffect, useState} from "react";
import {FeedRunner} from "./import/FeedRunner";
import {IonItem, IonLabel, IonSpinner} from "@ionic/react";

export const RunnerContext = createContext<number | undefined>(undefined)

export const RunnerContextProvider: React.FC<{ children: ReactNode, runner: FeedRunner }> = ({children, runner}) => {
    const [running, setRunning] = useState<number | undefined>()
    useEffect(() => {
        runner.onRun = setRunning
        runner.onFinished = () => setRunning(undefined)
    }, [runner]);

    return <RunnerContext.Provider value={running}>
        {running ? <IonItem color="light" style={{
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
