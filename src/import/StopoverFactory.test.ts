import {GTFSCalendar, GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../db/GTFS";
import {createStopover} from "./StopoverFactory";
import {Station} from "../db/Schedule";
import {describe, expect, it} from "vitest";

describe('StopoverFactory', () => {
    const stopTime: GTFSStopTime = {
        stop_sequence: 1,
        stop_id: '1',
        trip_id: '2',
        departure_time: '08:37:00'
    }
    const stop: GTFSStop = {
        stop_id: '1',
        parent_station: '90',
        stop_name: 'Ort',
        stop_lat: 1,
        stop_lon: 1,
        tokens: []
    }
    const trip: GTFSTrip = {
        trip_id: '2',
        route_id: '3',
        service_id: '4',
        trip_headsign: 'Budapest-Keleti',
        trip_short_name: 'IC 311',
        tokens: []
    }
    const route: GTFSRoute = {
        route_id: '3',
        route_type: 1,
        route_long_name: '',
        route_short_name: '',
        tokens: [],
    }
    const service: GTFSCalendar = {
        service_id: '4',
        start_date: '20230101',
        end_date: '20221231',
        friday: 1,
        monday: 1,
        saturday: 1,
        sunday: 1,
        thursday: 1,
        tuesday: 1,
        wednesday: 1
    }
    const station: Station = {
        id: '90',
        name: 'Graz Hbf',
        keywords: [],
        locations: [],
        stopIds: [],
        latitude: 0,
        longitude: 0,
    }
    it('should throw error for mismatched data', () => {
        expect(() => createStopover(stopTime, {
            ...stop,
            stop_id: '99'
        }, trip, route, station, [], service, [])).toThrowError('Data mismatch')
        expect(() => createStopover(stopTime, stop, {
            ...trip,
            trip_id: '99'
        }, route, station, [], service, [])).toThrowError('Data mismatch')
        expect(() => createStopover(stopTime, stop, trip, {
            ...route,
            route_id: '99'
        }, station, [], service, [])).toThrowError('Data mismatch')
        expect(() => createStopover(stopTime, stop, trip, route, station, [{
            ...stopTime,
            trip_id: '99'
        }], service, [])).toThrowError('Data mismatch')
    })
    it('should throw error for stop without parent station', () => {
        expect(() => createStopover(stopTime, {
            ...stop,
            parent_station: undefined
        }, trip, route, station, [], service, [])).toThrowError('Stop has no parent station')
    })
    it('should throw error for stop time without time', () => {
        expect(() => createStopover({
            ...stopTime,
            departure_time: undefined,
            arrival_time: undefined
        }, stop, trip, route, station, [], service, [])).toThrowError('Stop time has no departure or arrival time')

    })
    it('should create stopover from gtfs data', () => {
        const stopover = createStopover(stopTime, stop, trip, route, station, [], service, []);
        expect(stopover.trip_id).toEqual(trip.trip_id)
        expect(stopover.service_id).toEqual(trip.service_id)
        expect(stopover.route_id).toEqual(trip.route_id)
        expect(stopover.station_id).toEqual(stop.parent_station)
        expect(stopover.arrival_time).toBeUndefined()
        expect(stopover.departure_time).toEqual('08:37:00')
        expect(stopover.direction).toEqual('Budapest-Keleti')
        expect(stopover.line).toEqual('IC 311')

        const stopover2 = createStopover(stopTime, stop, {
            ...trip,
            trip_short_name: '',
            trip_headsign: 'Zentralfriedhof'
        }, {...route, route_short_name: '3/5'}, station, [], service, []);
        expect(stopover2.direction).toEqual('Zentralfriedhof')
        expect(stopover2.line).toEqual('3/5')
    })
})