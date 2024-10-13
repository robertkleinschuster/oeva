export const H3_RESOLUTION = 12;

export enum RouteType {
    TRAM = 0,
    SUBWAY = 1,
    RAIL = 2,
    BUS = 3,
    FERRY = 4,
    CABLE_TRAM = 5,
    AERIAL_LIFT = 6,
    FUNICULAR = 7,
    TROLLEYBUS = 11,
    MONORAIL = 12
}

export const routeTypeNames = new Map<RouteType, string>([
    [RouteType.RAIL, 'Zug'],
    [RouteType.SUBWAY, 'U-Bahn'],
    [RouteType.TRAM, 'Tram'],
    [RouteType.CABLE_TRAM, 'Straßenseilbahn'],
    [RouteType.BUS, 'Bus'],
    [RouteType.TROLLEYBUS, 'O-Bus'],
    [RouteType.FUNICULAR, 'Standseilbahn'],
    [RouteType.MONORAIL, 'Einschienenbahn'],
    [RouteType.FERRY, 'Fähre'],
    [RouteType.AERIAL_LIFT, 'Luftseilbahn'],
])

export enum Boarding {
    NONE,
    STANDARD,
    ONLY_DISEMBARKING,
    ONLY_BOARDING,
    ON_REQUEST,
    ON_CALL,
}

export enum Weekday {
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
}

export type WeekdayCode = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
