import {Home} from "./routes/Home.tsx";
import {Feeds} from "./routes/Feeds.tsx";
import {Router} from "framework7/types";
import {Stations} from "./routes/Stations.tsx";

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
] satisfies Router.RouteParameters[];