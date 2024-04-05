import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {RunnerContextProvider} from "./RunnerContext";
import {FeedRunner} from "./import/FeedRunner";

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
setTimeout(() => void runner.run(), 5000)