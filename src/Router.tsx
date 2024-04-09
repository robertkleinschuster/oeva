import React from "react";
import {isPlatform} from "@ionic/react";
import {createMemoryHistory} from "history";
import {IonReactMemoryRouter, IonReactRouter} from "@ionic/react-router";

const history = createMemoryHistory()

const Router: React.FC<{ children: React.ReactNode }> = ({children}) =>
    isPlatform('ios') ?
        <IonReactMemoryRouter history={history}>{children}</IonReactMemoryRouter> :
        <IonReactRouter>{children}</IonReactRouter>


export default Router;