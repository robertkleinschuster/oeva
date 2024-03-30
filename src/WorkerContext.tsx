import {createContext, ReactNode, useEffect, useState} from "react";
import {FeedRunner} from "./import/FeedRunner.ts";

export const WorkerContext = createContext<number|undefined>(undefined)

export const WorkerContextProvider = ({children, worker}: {children: ReactNode, worker: FeedRunner}) => {
    const [running, setRunning] = useState<number|undefined>()
    useEffect(() => {
        return clearInterval(setInterval(() => {
            setRunning(worker.running)
        }, 1000));
    }, [worker]);

    return <WorkerContext.Provider value={running}>
        {children}
    </WorkerContext.Provider>
}
