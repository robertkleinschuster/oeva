import {describe, expect, it} from "@jest/globals";
import {ExceptionType, isServiceRunningOn} from "./Schedule.ts";
import {Calendar, CalendarDate} from "../db/TransitDB.ts";

describe('Schedule', () => {
    it('should not be running when date is not in service period', () => {
        const service: Calendar = {
            service_id: '1',
            end_date: '20231214',
            start_date: '20221214',
            friday: 1,
            monday: 1,
            saturday: 1,
            sunday: 1,
            thursday: 1,
            tuesday: 1,
            wednesday: 1
        }
        expect(isServiceRunningOn(service, undefined, new Date('2024-03-23'))).toBe(false)
    })
    it('should not be running when weekday is not serviced', () => {
        const service: Calendar = {
            service_id: '1',
            end_date: '20241214',
            start_date: '20231214',
            friday: 1,
            monday: 1,
            saturday: 0,
            sunday: 1,
            thursday: 1,
            tuesday: 1,
            wednesday: 1
        }
        expect(isServiceRunningOn(service, undefined, new Date('2024-03-23'))).toBe(false)
    })
    it('should not be running when exception exists', () => {
        const service: Calendar = {
            service_id: '1',
            end_date: '20241214',
            start_date: '20231214',
            friday: 1,
            monday: 1,
            saturday: 1,
            sunday: 1,
            thursday: 1,
            tuesday: 1,
            wednesday: 1
        }
        const exception: CalendarDate = {
            service_id: '1',
            date: '20240323',
            exception_type: ExceptionType.NOT_RUNNING,
        }
        expect(isServiceRunningOn(service, exception, new Date('2024-03-23'))).toBe(false)
    })
    it('should be running when exception exists', () => {
        const service: Calendar = {
            service_id: '1',
            end_date: '20241214',
            start_date: '20231214',
            friday: 1,
            monday: 1,
            saturday: 0,
            sunday: 1,
            thursday: 1,
            tuesday: 1,
            wednesday: 1
        }
        const exception: CalendarDate = {
            service_id: '1',
            date: '20240323',
            exception_type: ExceptionType.RUNNING,
        }
        expect(isServiceRunningOn(service, exception, new Date('2024-03-23'))).toBe(true)
    })
    it('should be running when weekday is serviced and date is in service period', () => {
        const service: Calendar = {
            service_id: '1',
            end_date: '20241214',
            start_date: '20231214',
            friday: 1,
            monday: 1,
            saturday: 1,
            sunday: 1,
            thursday: 1,
            tuesday: 1,
            wednesday: 1
        }

        expect(isServiceRunningOn(service, undefined, new Date('2024-03-23'))).toBe(true)
    })
    it('should throw error when passed exception does not match the requested date', () => {
        const service: Calendar = {
            service_id: '1',
            end_date: '20241214',
            start_date: '20231214',
            friday: 1,
            monday: 1,
            saturday: 0,
            sunday: 1,
            thursday: 1,
            tuesday: 1,
            wednesday: 1
        }
        const exception: CalendarDate = {
            service_id: '1',
            date: '20240323',
            exception_type: ExceptionType.RUNNING,
        }
        expect(() => isServiceRunningOn(service, exception, new Date('2024-03-22'))).toThrow('Schedule exception does not match requested date')
    })
    it('should throw error when passed exception does not match the passed service by id', () => {
        const service: Calendar = {
            service_id: '1',
            end_date: '20241214',
            start_date: '20231214',
            friday: 1,
            monday: 1,
            saturday: 0,
            sunday: 1,
            thursday: 1,
            tuesday: 1,
            wednesday: 1
        }
        const exception: CalendarDate = {
            service_id: '2',
            date: '20240323',
            exception_type: ExceptionType.RUNNING,
        }
        expect(() => isServiceRunningOn(service, exception, new Date('2024-03-23'))).toThrow('Schedule exception does not match service id')
    })

})