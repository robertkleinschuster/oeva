const tableMap: Map<string, string> = new Map([
    ['agency.txt', 'agencies'],
    ['stops.txt', 'stops'],
    ['routes.txt', 'routes'],
    ['trips.txt', 'trips'],
    ['stop_times.txt', 'stopTimes'],
    ['calendar.txt', 'calendar'],
    ['calendar_dates.txt', 'calendarDates'],
    ['frequencies.txt', 'frequencies'],
    ['transfers.txt', 'transfers'],
    ['levels.txt', 'levels'],
    ['pathways.txt', 'pathways'],
    ['shapes.txt', 'shapes'],
]);

export const getTableName = (fileName: string): string | undefined => {
    return tableMap.get(fileName);
};

export const getFiles = (): string[] =>
{
    return Array.from(tableMap.keys())
}