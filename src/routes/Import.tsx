import ImportTest from "../ImportTest.tsx";
import {Navbar, Page} from "framework7-react";

export const Import = () => (
    <Page>
        <Navbar title="Import" large backLink/>
        <ImportTest></ImportTest>
    </Page>
);