import {GTFSStop, GTFSStopTime} from "../db/GTFS";
import {createTripStop} from "./TripStopFactory";
import {Boarding, RouteType, Stop, Trip} from "../db/Schedule";
import {describe, expect, it} from "vitest";
import {latLngToCell} from "h3-js";

describe('TripStopFactory', () => {
    const trip: Trip = {
        id: '9-2',
        feed_id: 9,
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
        stop_sequence: 5,
        stop_id: '1',
        trip_id: '2',
        departure_time: '08:37:00'
    }
    const stop: Stop = {
        id: '9-1',
        name: 'Graz Hbf',
        keywords: [],
        feed_stop_id: '1',
        feed_id: 9,
        h3_cell: latLngToCell(1, 1, 14)

    }
    it('should throw error for mismatched data', () => {
        expect(() => createTripStop({
            ...trip,
            feed_trip_id: '99'
        }, stop, stopTime)).toThrowError('Data mismatch')
        expect(() => createTripStop(trip, stop, {...stopTime, trip_id: '99'})).toThrowError('Data mismatch')
        expect(() => createTripStop(trip, {
            ...stop,
            h3_cell: '99'
        }, {...stopTime, trip_id: '99'})).toThrowError('Data mismatch')

    })
    it('should throw error for stop time without time', () => {
        expect(() => createTripStop(trip, stop, {
            ...stopTime,
            departure_time: undefined,
            arrival_time: undefined
        })).toThrowError('Stop time has no departure or arrival time')

    })
    it('should create trip stop from gtfs data', () => {
        const tripStop = createTripStop(trip, stop, stopTime);
        expect(tripStop.id).toEqual("9-1-9-2-5")
        expect(tripStop.trip_id).toEqual(trip.id)
        expect(tripStop.stop_id).toEqual(stop.id)
        expect(tripStop.arrival_time).toBeUndefined()
        expect(tripStop.departure_time).toEqual('08:37:00')
        expect(tripStop.direction).toEqual('Budapest-Keleti')
        expect(tripStop.trip_name).toEqual('IC 311')
        expect(tripStop.boarding).toEqual(Boarding.STANDARD)
    })
    it('should set boarding none for service stop', () => {
        const tripStop = createTripStop(trip, stop, {
            ...stopTime,
            pickup_type: 1,
            drop_off_type: 1
        });
        expect(tripStop.boarding).toEqual(Boarding.NONE)
    })
    it('should set boarding on request for request stop', () => {
        const tripStop = createTripStop(trip, stop, {
            ...stopTime,
            pickup_type: 2,
            drop_off_type: 2
        });
        expect(tripStop.boarding).toEqual(Boarding.ON_REQUEST)
    })
    it('should set boarding on request for request stop', () => {
        const tripStop = createTripStop(trip, stop, {
            ...stopTime,
            pickup_type: 3,
            drop_off_type: 3
        });
        expect(tripStop.boarding).toEqual(Boarding.ON_CALL)
    })
    it('should set boarding disembark only', () => {
        const tripStop = createTripStop(trip, stop, {
            ...stopTime,
            pickup_type: 1,
            drop_off_type: 0
        });
        expect(tripStop.boarding).toEqual(Boarding.ONLY_DISEMBARKING)
    })
    it('should set boarding only', () => {
        const tripStop = createTripStop(trip, stop, {
            ...stopTime,
            pickup_type: 0,
            drop_off_type: 1
        });
        expect(tripStop.boarding).toEqual(Boarding.ONLY_BOARDING)
    })
})