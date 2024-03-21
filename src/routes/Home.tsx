import {List, ListItem, Navbar, Page} from "framework7-react";

export const Home = () => (
    <Page name="home">
        <Navbar title="OeVA" large transparent/>
        <List strong>
            <ListItem link="/feeds">Feeds</ListItem>
        </List>
    </Page>
)