import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Import F7 Bundle
import Framework7 from 'framework7/bundle';
import 'framework7/css/bundle';
import 'framework7-icons';

// Import F7-React Plugin
import Framework7React from 'framework7-react';

import {FeedRunner} from "./import/FeedRunner.ts";
import {RunnerContextProvider} from "./RunnerContext.tsx";

// Init F7-React Plugin
Framework7.use(Framework7React);

const runner = new FeedRunner()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RunnerContextProvider runner={runner}>
            <App/>
        </RunnerContextProvider>
    </React.StrictMode>,
)

void runner.run()