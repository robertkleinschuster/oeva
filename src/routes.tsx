import {Home} from "./routes/Home.tsx";
import {Feeds} from "./routes/Feeds.tsx";
import {Router} from "framework7/types";

export default [
    {
        path: "/",
        component: Home
    },
    {
        path: "/feeds",
        component: Feeds
    }
] satisfies Router.RouteParameters[];