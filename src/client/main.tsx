import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {RunnerContextProvider} from "./RunnerContext.tsx";
import {FeedRunner} from "./import/FeedRunner";
import {tryPersistWithoutPromptingUser} from "./fs/StorageManager.ts";

const runner = new FeedRunner();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <RunnerContextProvider runner={runner}>
            <App/>
        </RunnerContextProvider>
    </React.StrictMode>
);
setTimeout(async () => {
    await runner.run()
}, 5000)

void tryPersistWithoutPromptingUser()

