import {List, ListItem, Navbar, Page} from "framework7-react";

export const Home = () => (
    <Page name="home">
        <Navbar title="OeVA" large/>
        <List strong>
            <ListItem link="/import">Import</ListItem>
        </List>
    </Page>
)