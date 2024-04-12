import {isTripStopActiveOn} from "./Schedule";
import {ExceptionType} from "../db/GTFS";
import {describe, expect, it} from "vitest";
import {Boarding, RouteType, TripStop} from "../db/Schedule";

describe('Schedule', () => {
    const tripStop: TripStop = {
        id: '1-2',
        trip_id: '1',
        stop_id: '2',
        feed_id: 1,
        service_end_date: 20241214,
        service_start_date: 20231214,
        service_exceptions: new Map,
        service_weekdays: 127,
        arrival_time: undefined,
        boarding: Boarding.STANDARD,
        h3_cell_le1: 0,
        h3_cell_le2: 0,
        departure_time: undefined,
        is_destination: false,
        is_origin: false,
        hour: 0,
        route_type: RouteType.RAIL,
        sequence_in_trip: 3,
        sequence_at_stop: 0,
    }
    it('should not be running when date is not in service period', () => {
        expect(isTripStopActiveOn(tripStop, new Date('2023-03-23'))).toBe(false)
    })
    it('should not be running when weekday is not serviced', () => {
        expect(isTripStopActiveOn({...tripStop, service_weekdays: 125}, new Date('2024-03-23'))).toBe(false)
    })
    it('should not be running when exception exists', () => {
        const tripStop1 = {...tripStop, service_exceptions: new Map([[20240323, ExceptionType.NOT_RUNNING]])};
        expect(isTripStopActiveOn(tripStop1, new Date('2024-03-23'))).toBe(false)
    })
    it('should be running when exception exists', () => {
        const tripStop1 = {
            ...tripStop,
            service_weekdays: 125,
            service_exceptions: new Map([[20240323, ExceptionType.RUNNING]])
        };
        expect(isTripStopActiveOn(tripStop1, new Date('2024-03-23'))).toBe(true)
    })
    it('should be running when weekday is serviced and date is in service period', () => {
        expect(isTripStopActiveOn(tripStop, new Date('2024-03-23'))).toBe(true)
    })
})