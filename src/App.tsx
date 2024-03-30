import {Redirect, Route} from 'react-router-dom';
import {IonApp, IonButton, IonContent, IonRouterOutlet, setupIonicReact} from '@ionic/react';
import {IonReactRouter} from '@ionic/react-router';
import {useRegisterSW} from "virtual:pwa-register/react";
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
import React from "react";
import Feeds from "./pages/Feeds";
import StationSearch from "./pages/StationSearch";
import AddFeed from "./pages/AddFeed";
import EditFeed from "./pages/EditFeed";
import Station from "./pages/Station";
import Trip from "./pages/Trip";

setupIonicReact();

const App: React.FC = () => {
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        async onRegisteredSW(r: string) {
            console.log('SW Registered: ', r);
        },
        onRegisterError(error: any) {
            console.error('SW Registration Error: ', error);
        },
    });

    return <IonApp>
        {needRefresh ?
            <IonContent>
                <p>Es ist eine neue Version von OeVA Beta verfügbar!</p>
                <IonButton onClick={() => {
                    void updateServiceWorker(true)
                }}>Jetzt aktualisieren
                </IonButton>
            </IonContent> : null}
        <IonReactRouter>
            <IonRouterOutlet>
                <Route exact path="/home" component={Home}/>
                <Route exact path="/feeds" component={Feeds}/>
                <Route exact path="/feeds/add" component={AddFeed}/>
                <Route exact path="/feeds/edit/:id" component={EditFeed}/>
                <Route exact path="/stations" component={StationSearch}/>
                <Route exact path="/stations/:id" component={Station}/>
                <Route exact path="/trips/:id" component={Trip}/>
                <Route exact path="/">
                    <Redirect to="/home"/>
                </Route>
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
};

export default App;
