import React, {createContext, ReactNode, useEffect, useState} from "react";
import {FeedRunner} from "./import/FeedRunner";
import {TransitFeed} from "./db/Feed";
import {feedDb} from "./db/FeedDb";
import FeedStatus from "./components/FeedStatus";
import {IonItem, IonLabel, IonSpinner, IonToggle} from "@ionic/react";
import NoSleep from 'nosleep.js';

export const RunnerContext = createContext<number | undefined>(undefined)
const nosleep = new NoSleep();

export const RunnerContextProvider = ({children, runner}: { children: ReactNode, runner: FeedRunner }) => {
    const [running, setRunning] = useState<number | undefined>()
    const [runningFeed, setRunningFeed] = useState<TransitFeed | undefined>()
    useEffect(() => {
        const interval = setInterval(() => {
            setRunning(runner.running)
            if (runner.running) {
                feedDb.transit.get(runner.running).then(setRunningFeed)
            } else {
                setRunningFeed(undefined)
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [runner]);

    return <RunnerContext.Provider value={running}>
        {runningFeed ? <IonItem color="light" style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            zIndex: 1,
            width: 'calc(100% - 2rem)',
            margin: '1rem',
            borderRadius: '.5rem'
        }}>
            <IonSpinner slot="end"/>
            <IonToggle slot="start" onIonChange={(e) => {
                if (e.detail.checked) {
                    nosleep.enable()
                } else {
                    nosleep.disable()
                }
            }} labelPlacement="stacked">Bildschirm ein</IonToggle>
            <IonLabel>
                <FeedStatus feed={runningFeed}/>
            </IonLabel>
        </IonItem> : null}

        {children}
    </RunnerContext.Provider>
}
