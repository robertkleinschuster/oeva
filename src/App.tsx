import {useRegisterSW} from "virtual:pwa-register/react";
import {App, View} from 'framework7-react';
import routes from "./routes/routes.tsx";

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
        {needRefresh && (
            <div>
                <p>A new update is available!</p>
                <button onClick={handleRefresh}>Refresh</button>
            </div>
        )}

        <View main/>
    </App>
}

