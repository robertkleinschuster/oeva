import {Redirect, Route} from 'react-router-dom';
import {
    IonApp,
    IonButton,
    IonItem,
    IonLabel,
    IonRouterOutlet,
    setupIonicReact
} from '@ionic/react';
import Home from './pages/Home';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import React, {useContext} from "react";
import Feeds from "./pages/Feeds";
import StopSearch from "./pages/StopSearch";
import Stop from "./pages/Stop";
import Trip from "./pages/Trip";
import {useRegisterSW} from "virtual:pwa-register/react";
import {RunnerContext} from "./RunnerContext.tsx";
import Storage from "./pages/Storage";
import Router from "./Router.tsx";
import Connections from "./pages/Connections";
import TripSearch from "./pages/TripSearch";

setupIonicReact({
    swipeBackEnabled: true,
});

const App: React.FC = () => {
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW();

    const [running] = useContext(RunnerContext)

    return <IonApp>
        {needRefresh ?
            <IonItem color="light" style={{
                position: 'absolute',
                bottom: running ? '4rem' : '0',
                right: '0',
                zIndex: 1,
                width: 'calc(100% - 2rem)',
                margin: '1rem',
                borderRadius: '.5rem'
            }}>
                <IonLabel>Es ist eine neue Version von OeVA Beta verfügbar!</IonLabel>
                <IonButton onClick={() => {
                    void updateServiceWorker(true)
                }}>Jetzt aktualisieren
                </IonButton>
            </IonItem> : null}

        <Router>
            <IonRouterOutlet>
                <Route exact path="/home" component={Home}/>
                <Route exact path="/feeds" component={Feeds}/>
                <Route exact path="/storage" component={Storage}/>
                <Route exact path="/stops" component={StopSearch}/>
                <Route exact path="/trips" component={TripSearch}/>
                <Route exact path="/stops/:id" component={Stop}/>
                <Route exact path="/trips/:id" component={Trip}/>
                <Route exact path="/connections/:id" component={Connections}/>
                <Route exact path="/">
                    <Redirect to="/home"/>
                </Route>
            </IonRouterOutlet>
        </Router>
    </IonApp>
};

export default App;
