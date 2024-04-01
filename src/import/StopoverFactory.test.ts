import {GTFSStop, GTFSStopTime} from "../db/GTFS";
import {createStopover} from "./StopoverFactory";
import {Boarding, RouteType, Station, Trip} from "../db/Schedule";
import {describe, expect, it} from "vitest";
import {latLngToCell} from "h3-js";

describe('StopoverFactory', () => {
    const trip: Trip = {
        id: '1-2',
        feed_id: 1,
        feed_trip_id: '2',
        direction: 'Budapest-Keleti',
        name: 'IC 311',
        service: {
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
        },
        route_type: RouteType.RAIL,
        exceptions: new Map,
        keywords: []
    }
    const stopTime: GTFSStopTime = {
        stop_sequence: 1,
        stop_id: '1',
        trip_id: '2',
        departure_time: '08:37:00'
    }
    const stop: GTFSStop = {
        stop_id: '1',
        stop_name: 'Ort',
        stop_lat: 1,
        stop_lon: 1,
    }
    const station: Station = {
        id: '90',
        name: 'Graz Hbf',
        keywords: [],
        h3_cells: [
            latLngToCell(1, 1, 14)
        ]
    }
    it('should throw error for mismatched data', () => {
        expect(() => createStopover(station, trip, stopTime, {...stop, stop_id: '99'})).toThrowError('Data mismatch')
        expect(() => createStopover(station, {
            ...trip,
            feed_trip_id: '99'
        }, stopTime, stop)).toThrowError('Data mismatch')
        expect(() => createStopover(station, trip, {...stopTime, trip_id: '99'}, stop)).toThrowError('Data mismatch')
        expect(() => createStopover({
            ...station,
            h3_cells: ['99']
        }, trip, {...stopTime, trip_id: '99'}, stop)).toThrowError('Data mismatch')

    })
    it('should throw error for stop time without time', () => {
        expect(() => createStopover(station, trip, {
            ...stopTime,
            departure_time: undefined,
            arrival_time: undefined
        }, stop)).toThrowError('Stop time has no departure or arrival time')

    })
    it('should create stopover from gtfs data', () => {
        const stopover = createStopover(station, trip, stopTime, stop);
        expect(stopover.trip_id).toEqual(trip.id)
        expect(stopover.station_id).toEqual(station.id)
        expect(stopover.arrival_time).toBeUndefined()
        expect(stopover.departure_time).toEqual('08:37:00')
        expect(stopover.direction).toEqual('Budapest-Keleti')
        expect(stopover.line).toEqual('IC 311')
        expect(stopover.boarding).toEqual(Boarding.STANDARD)
    })
    it('should set boarding none for service stop', () => {
        const stopover = createStopover(station, trip, {
            ...stopTime,
            pickup_type: 1,
            drop_off_type: 1
        }, stop);
        expect(stopover.boarding).toEqual(Boarding.NONE)
    })
    it('should set boarding on request for request stop', () => {
        const stopover = createStopover(station, trip, {
            ...stopTime,
            pickup_type: 2,
            drop_off_type: 2
        }, stop);
        expect(stopover.boarding).toEqual(Boarding.ON_REQUEST)
    })
    it('should set boarding on request for request stop', () => {
        const stopover = createStopover(station, trip, {
            ...stopTime,
            pickup_type: 3,
            drop_off_type: 3
        }, stop);
        expect(stopover.boarding).toEqual(Boarding.ON_CALL)
    })
    it('should set boarding disembark only', () => {
        const stopover = createStopover(station, trip, {
            ...stopTime,
            pickup_type: 1,
            drop_off_type: 0
        }, stop);
        expect(stopover.boarding).toEqual(Boarding.ONLY_DISEMBARKING)
    })
    it('should set boarding only', () => {
        const stopover = createStopover(station, trip, {
            ...stopTime,
            pickup_type: 0,
            drop_off_type: 1
        }, stop);
        expect(stopover.boarding).toEqual(Boarding.ONLY_BOARDING)
    })
})