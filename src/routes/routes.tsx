import {Home} from "./Home.tsx";
import {Import} from "./Import.tsx";
import {Router} from "framework7/types";

export default [
    {
        path: "/",
        component: Home
    },
    {
        path: "/import",
        component: Import
    }
] satisfies Router.RouteParameters[];