import {createContext, ReactNode, useEffect, useState} from "react";
import {FeedRunner} from "./import/FeedRunner.ts";

export const RunnerContext = createContext<number | undefined>(undefined)

export const RunnerContextProvider = ({children, runner}: { children: ReactNode, runner: FeedRunner }) => {
    const [running, setRunning] = useState<number | undefined>()
    useEffect(() => {
        const interval = setInterval(() => {
            setRunning(runner.running)
        }, 1000);
        return () => clearInterval(interval);
    }, [runner]);

    return <RunnerContext.Provider value={running}>
        {children}
    </RunnerContext.Provider>
}
