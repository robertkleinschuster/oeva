import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {RunnerContextProvider} from "./RunnerContext";
import {FeedRunner} from "./import/FeedRunner";
import {preventBrowserHistorySwipeGestures} from "./block-swipe";
preventBrowserHistorySwipeGestures()

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

void runner.run();