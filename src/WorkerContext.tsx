import {createContext, ReactNode, useEffect, useState} from "react";

export const WorkerContext = createContext<number|undefined>(undefined)

export const WorkerContextProvider = ({children, worker}: {children: ReactNode, worker: Worker}) => {
    const [running, setRunning] = useState<number|undefined>()
    useEffect(() => {
        worker.onmessage = (e) => {
            setRunning(e.data)
        }
    }, [worker]);

    return <WorkerContext.Provider value={running}>
        {children}
    </WorkerContext.Provider>
}
