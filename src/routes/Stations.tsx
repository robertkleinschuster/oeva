import {Trips} from "../components/Trips.tsx";
import {TripAtStop, TripDetailRepository} from "../transit/TripDetailRepository.ts";
import {useEffect, useRef, useState} from "react";
import {f7, Navbar, Page, Searchbar, Subnavbar} from "framework7-react";
import {Stop, transitDB} from "../db/TransitDB.ts";
import {Autocomplete} from "framework7/types";
import lunr from "lunr";

export const Stations = () => {
    const [stop, setStop] = useState<Stop | null>(null)
    const [trips, setTrips] = useState<TripAtStop[]>([])
    const autocompleteSearchbar = useRef<Autocomplete.Autocomplete | null>(null);

    useEffect(() => {
        if (stop?.stop_id) {
            const repo = new TripDetailRepository();
            repo.findByStops([stop.stop_id], new Date())
                .then(setTrips);
        }
    }, [stop]);

    const onPageInit = () => {
        autocompleteSearchbar.current = f7.autocomplete.create({
            openIn: 'dropdown',
            inputEl: '#searchbar-autocomplete input[type="search"]',
            dropdownPlaceholderText: 'Tippe z.B. "Graz"',
            searchbarPlaceholder: 'Station Suchen',
            searchbarSpellcheck: false,
            textProperty: 'stop_name',
            valueProperty: 'stop_name',
            updateInputValueOnSelect: true,
            async source(query, render) {
                if (query.length === 0) {
                    render([]);
                    return;
                }
                const tokens = lunr.tokenizer(query).map(String);
                const stops = await transitDB.stops.where('tokens')
                    .startsWithAnyOfIgnoreCase(tokens)
                    .toArray()

                const results = new Map<string, Stop>;

                stops.sort((a, b) => {
                    const aLength = a.tokens.filter(token => tokens.includes(token)).length
                    const bLength = b.tokens.filter(token => tokens.includes(token)).length

                    if (aLength > bLength) {
                        return -1;
                    }
                    if (aLength < bLength) {
                        return 1;
                    }
                    return 0;
                }).forEach(stop => {
                    if (!results.has(stop.stop_name)) {
                        results.set(stop.stop_name, stop)
                    }
                })

                render(Array.from(results.values()));
            },
            on: {
                change: (values) => {
                    if (values.length) {
                        setStop(values.pop())
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

        <Trips trips={trips.filter(trip => trip.departure)}/>
    </Page>
}