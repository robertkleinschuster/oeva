import {useRegisterSW} from "virtual:pwa-register/react";
import {App, Block, Button, View} from 'framework7-react';
import routes from "./routes.tsx";

export default () => {
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        async onRegisteredSW(r) {
            console.log('SW Registered: ', r);
        },
        onRegisterError(error) {
            console.error('SW Registration Error: ', error);
        },
    });

    const handleRefresh = () => {
        void updateServiceWorker(true);
    };

    return <App theme="ios" name="OeVA Beta" routes={routes}>
        {needRefresh ?
            <Block>
                <p>Es ist eine neue Version von OeVA Beta verfügbar!</p>
                <Button fill large onClick={handleRefresh}>Jetzt aktualisieren</Button>
            </Block> : null}
        <View main/>
    </App>
}

