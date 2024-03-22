import {Trips} from "../components/Trips.tsx";
import {TripDetail, TripDetailRepository} from "../transit/TripDetailRepository.ts";
import {useEffect, useRef, useState} from "react";
import {f7, Navbar, Page, Searchbar, Subnavbar} from "framework7-react";
import {Stop, transitDB} from "../db/TransitDB.ts";
import {Autocomplete} from "framework7/types";

export const Stations = () => {
    const [stop, setStop] = useState<Stop|null>(null)
    const [trips, setTrips] = useState<TripDetail[]>([])
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

                const stops = await transitDB.stops.where('stop_name').startsWithIgnoreCase(query).toArray()
                render(stops);
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