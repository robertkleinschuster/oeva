import {GTFSRoute, GTFSStop, GTFSStopTime, GTFSTrip} from "../db/GTFS";
import {createStop, createTrip, createTripStop} from "./TripStopFactory";
import {Boarding, RouteType, Stop, Trip} from "../db/Schedule";
import {describe, expect, it} from "vitest";
import {TransitFeed, TransitFeedStatus} from "../db/Feed";

describe('TripStopFactory', () => {
    const trip: Trip = {
        id: '9-2',
        feed_id: 9,
        feed_name: '',
        feed_trip_id: '2',
        direction: 'Budapest-Keleti',
        name: 'IC 311',
        service_weekdays: 127,
        service_start_date: 20230101,
        service_end_date: 20221231,
        route_type: RouteType.RAIL,
        service_exceptions: new Map,
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
        feed_name: '',
        keywords: [],
        feed_stop_id: '1',
        feed_id: 9,
        h3_cell_le1: 0,
        h3_cell_le2: 0,
    }
    const feed: TransitFeed = {
        id: 1,
        name: '',
        url: '',
        status: TransitFeedStatus.DONE,
    }
    it('should throw error for mismatched data', () => {
        expect(() => createTripStop({
            ...trip,
            feed_trip_id: '99'
        }, stop, stopTime)).toThrowError('Data mismatch')
        expect(() => createTripStop(trip, stop, {...stopTime, stop_id: '99'})).toThrowError('Data mismatch')
        expect(() => createTripStop(trip, stop, {...stopTime, trip_id: '99'})).toThrowError('Data mismatch')

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
        expect(tripStop.departure_time).toEqual(837)
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
    it('should extract platform from stop name', () => {
        const gtfsStop: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf 1b',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop = createStop(feed, gtfsStop)
        expect(stop.platform).toEqual('1b')
        expect(stop.name).toEqual('Graz Hbf')

        const gtfsStop2: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf 1',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop2 = createStop(feed, gtfsStop2)
        expect(stop2.platform).toEqual('1')
        expect(stop2.name).toEqual('Graz Hbf')

        const gtfsStop3: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf X',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop3 = createStop(feed, gtfsStop3)
        expect(stop3.platform).toEqual('X')
        expect(stop3.name).toEqual('Graz Hbf')

        const gtfsStop4: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf 12',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop4 = createStop(feed, gtfsStop4)
        expect(stop4.platform).toEqual('12')
        expect(stop4.name).toEqual('Graz Hbf')
    })
    it('should extract platform from stop platform code and remove it from name', () => {
        const gtfsStop: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf 1b',
            platform_code: '1b',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop = createStop(feed, gtfsStop)
        expect(stop.platform).toEqual('1b')
        expect(stop.name).toEqual('Graz Hbf')

        const gtfsStop2: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf 1',
            platform_code: '1',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop2 = createStop(feed, gtfsStop2)
        expect(stop2.platform).toEqual('1')
        expect(stop2.name).toEqual('Graz Hbf')

        const gtfsStop3: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf X',
            platform_code: 'X',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop3 = createStop(feed, gtfsStop3)
        expect(stop3.platform).toEqual('X')
        expect(stop3.name).toEqual('Graz Hbf')

        const gtfsStop4: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf',
            platform_code: 'X',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop4 = createStop(feed, gtfsStop4)
        expect(stop4.platform).toEqual('X')
        expect(stop4.name).toEqual('Graz Hbf')
    })
    it('should not remove unmatching platform from name', () => {
        const gtfsStop: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf 1b',
            platform_code: '1c',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop = createStop(feed, gtfsStop)
        expect(stop.platform).toEqual('1c')
        expect(stop.name).toEqual('Graz Hbf 1b')

        const gtfsStop2: GTFSStop = {
            stop_id: '99',
            stop_name: 'Graz Hbf 99',
            platform_code: '1',
            stop_lat: 0,
            stop_lon: 0,
        }
        const stop2 = createStop(feed, gtfsStop2)
        expect(stop2.platform).toEqual('1')
        expect(stop2.name).toEqual('Graz Hbf 99')
    })
    it('should extract train category and number for route typ rail', () => {
        const gtfsTrip: GTFSTrip = {
            trip_id: '1',
            route_id: '2',
            service_id: '3',
            trip_short_name: 'S 4040'
        }
        const gtfsRoute: GTFSRoute = {
            route_id: '2',
            route_type: RouteType.RAIL,
            route_long_name: '',
            route_short_name: 'S5',
        }
        const trip = createTrip(feed, gtfsTrip, gtfsRoute, undefined, [])
        expect(trip.number).toEqual('4040')
        expect(trip.category).toEqual('S')
        expect(trip.line).toEqual('S5')
    })
    it('should only set the line name for non rail route types', () => {
        const gtfsTrip: GTFSTrip = {
            trip_id: '1',
            route_id: '2',
            service_id: '3',
            trip_short_name: 'S 4040'
        }
        const gtfsRoute: GTFSRoute = {
            route_id: '2',
            route_type: RouteType.BUS,
            route_long_name: '',
            route_short_name: '62',
        }
        const trip = createTrip(feed, gtfsTrip, gtfsRoute, undefined, [])
        expect(trip.line).toEqual('62')
        expect(trip.number).toBeUndefined()
        expect(trip.category).toBeUndefined()
    })
})