import {Calendar, CalendarDate, Route, Stop, StopTime, transitDB, Trip} from "../db/TransitDB.ts";
import {formatServiceDate, parseServiceDate, parseStopTime} from "./DateTime.ts";

export interface TripDetail {
    departure: Date | null;
    arrival: Date | null;
    isDestination: boolean;
    isOrigin: boolean;
    trip: Trip;
    route: Route;
    stop: Stop;
    stopTimes: StopTime[]
    stopTime: StopTime;
    service: Calendar;
    exception: CalendarDate | undefined;
}


export class TripDetailRepository {
    async findByStops(stopIds: string[], date: Date): Promise<TripDetail[]> {
        const trips: TripDetail[] = [];

        const stops = await transitDB.stops.where('stop_id').anyOf(stopIds).toArray();

        for (const stop of stops) {
            const stopTimes = await transitDB.stopTimes.where({stop_id: stop.stop_id}).toArray();
            for (const stopTime of stopTimes) {
                const trip = await transitDB.trips.get(stopTime.trip_id);
                if (trip) {
                    const service = await transitDB.calendar.get(trip.service_id);
                    const route = await transitDB.routes.get(trip.route_id)
                    if (service && route) {
                        const exception = await transitDB.calendarDates
                            .get({service_id: service.service_id, date: formatServiceDate(date)});
                        if (await this.isServiceActiveOn(service, exception, date)) {
                            const tripStopTimes = await transitDB.stopTimes.where({trip_id: trip.trip_id}).toArray()
                            const isDestination = stopTime.stop_sequence === Math.max(...tripStopTimes.map(s => s.stop_sequence));
                            const isOrigin = stopTime.stop_sequence === Math.min(...tripStopTimes.map(s => s.stop_sequence))
                            const tripDetail: TripDetail = {
                                departure: stopTime.departure_time && !isDestination ? parseStopTime(stopTime.departure_time, date) : null,
                                arrival: stopTime.arrival_time && !isOrigin ? parseStopTime(stopTime.arrival_time, date) : null,
                                trip: trip,
                                route: route,
                                stop: stop,
                                stopTime: stopTime,
                                service: service,
                                stopTimes: tripStopTimes,
                                exception: exception,
                                isDestination: isDestination,
                                isOrigin: isOrigin
                            };

                            trips.push(tripDetail);
                        }
                    }

                }
            }
        }

        return trips.sort((a, b) => {
            const date1 = a.departure ?? a.arrival
            const date2 = b.departure ?? b.arrival;

            if (date1 === null || date2 === null) {
                return 0;
            }

            if (date1 > date2) {
                return 1;
            }

            if (date1 < date2) {
                return -1;
            }

            return 0;
        });
    }


    private async isServiceActiveOn(service: Calendar, exception: CalendarDate | undefined, date: Date) {
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = weekdays[date.getDay()] as keyof Calendar;

        if (exception) {
            if (exception.exception_type === 1) {
                return true;
            }
            if (exception.exception_type === 2) {
                return false;
            }
        }

        return service[dayOfWeek] === 1
            && date >= parseServiceDate(service.start_date, date)
            && date <= parseServiceDate(service.end_date, date);
    }
}


