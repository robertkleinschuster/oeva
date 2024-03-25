import {Trips} from "../components/Trips.tsx";
import {StopoverRepository} from "../transit/StopoverRepository.ts";
import {useEffect, useRef, useState} from "react";
import {f7, Navbar, Page, Searchbar, Subnavbar} from "framework7-react";
import {Autocomplete} from "framework7/types";
import lunr from "lunr";
import {scheduleDB} from "../db/ScheduleDB.ts";
import {Station, Stopover} from "../db/Schedule.ts";

export const Stations = () => {
    const [station, setStation] = useState<Station | null>(null)
    const [stopovers, setStopovers] = useState<Stopover[]>([])
    const autocompleteSearchbar = useRef<Autocomplete.Autocomplete | null>(null);

    useEffect(() => {
        if (station?.id) {
            const repo = new StopoverRepository();
            repo.findByStation(station.id, new Date())
                .then(setStopovers);
        }
    }, [station]);

    const onPageInit = () => {
        autocompleteSearchbar.current = f7.autocomplete.create({
            openIn: 'dropdown',
            inputEl: '#searchbar-autocomplete input[type="search"]',
            dropdownPlaceholderText: 'Tippe z.B. "Graz"',
            searchbarPlaceholder: 'Station Suchen',
            searchbarSpellcheck: false,
            textProperty: 'name',
            valueProperty: 'name',
            updateInputValueOnSelect: true,
            async source(query, render) {
                if (query.length === 0) {
                    render([]);
                    return;
                }
                const tokens = lunr.tokenizer(query).map(String);
                const stations = await scheduleDB.station.where('keywords')
                    .startsWithAnyOfIgnoreCase(tokens)
                    .toArray()

                const results = new Map<string, Station>;

                stations.sort((a, b) => {
                    const aLength = a.keywords.filter(token => tokens.includes(token)).length
                    const bLength = b.keywords.filter(token => tokens.includes(token)).length

                    if (aLength > bLength) {
                        return -1;
                    }
                    if (aLength < bLength) {
                        return 1;
                    }
                    return 0;
                }).forEach(station => {
                    if (!results.has(station.name)) {
                        results.set(station.name, station)
                    }
                })

                render(Array.from(results.values()));
            },
            on: {
                change: (values) => {
                    if (values.length) {
                        setStation(values.pop())
                    }
                }
            }
        });

        f7.searchbar.create({
            el: '#searchbar-autocomplete',
            customSearch: true
        });
    }

    const onPageBeforeRemove = () => {
        autocompleteSearchbar.current?.destroy()
    }

    return <Page onPageInit={onPageInit} onPageBeforeRemove={onPageBeforeRemove}>
        <Navbar title="Stationen" backLink>
            <Subnavbar inner={false}>
                <Searchbar init={false} id="searchbar-autocomplete" disableButton={true} placeholder="Station Suchen"/>
            </Subnavbar>
        </Navbar>

        <Trips stopovers={stopovers.filter(trip => !trip.is_destination)}/>
    </Page>
}