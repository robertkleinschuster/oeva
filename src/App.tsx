import './App.css'
import {useRegisterSW} from "virtual:pwa-register/react";
import GTFSUpload from "./GTFSUpload.tsx";
import StationSearch from "./StationSearch.tsx";

function App() {
    const {
        needRefresh: [needRefresh],
        offlineReady: [offlineReady],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(r) {
            console.log('SW Registered: ', r);
        },
        onRegisterError(error) {
            console.error('SW Registration Error: ', error);
        },
    });

    const handleRefresh = () => {
        updateServiceWorker(true);
    };


    return (
        <>
            {/* Your app content */}

            {needRefresh && (
                <div>
                    <p>A new update is available!</p>
                    <button onClick={handleRefresh}>Refresh</button>
                </div>
            )}

            {offlineReady && (
                <p>The app is ready to work offline!</p>
            )}

            <GTFSUpload/>
            <StationSearch/>
        </>
    )
}

export default App
