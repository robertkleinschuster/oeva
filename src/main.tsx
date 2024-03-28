import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Import F7 Bundle
import Framework7 from 'framework7/bundle';
import 'framework7/css/bundle';
import 'framework7-icons';

// Import F7-React Plugin
import Framework7React from 'framework7-react';

// Import feed runner as web worker with vite ?worker feature
import FeedRunnerWorker from "./import/FeedRunner.ts?worker";
import {WorkerContextProvider} from "./WorkerContext.tsx";

// Init F7-React Plugin
Framework7.use(Framework7React);

const worker = new FeedRunnerWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <WorkerContextProvider worker={worker}>
            <App/>
        </WorkerContextProvider>
    </React.StrictMode>,
)

worker.postMessage('run')