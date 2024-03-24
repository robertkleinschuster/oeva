import {Home} from "./routes/Home.tsx";
import {Feeds} from "./routes/Feeds.tsx";
import {Router} from "framework7/types";
import {Stations} from "./routes/Stations.tsx";
import {Trip} from "./routes/Trip.tsx";

export default [
    {
        path: "/",
        component: Home
    },
    {
        path: "/feeds",
        component: Feeds
    },
    {
        path: "/stations",
        component: Stations,
    },
    {
        path: "/trip/:tripId",
        component: Trip
    }
] satisfies Router.RouteParameters[];