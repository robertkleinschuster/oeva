import {Trip} from "../db/Schedule";
import Tokenizer from "wink-tokenizer";
import {transliterate} from "transliteration";
import {scheduleDB} from "../db/ScheduleDB";
import Fuse from "fuse.js";

export async function searchTrip(keyword: string, limit = 10): Promise<Trip[]> {
    const transliteratedKeyword = transliterate(keyword);
    const tokenizer = new Tokenizer()
    const tokens = tokenizer.tokenize(transliteratedKeyword).map(token => token.value)

    const trips = new Map<string, Trip>()
    await findTrips(transliteratedKeyword, trip => trips.set(trip.id, trip), limit)

    if (trips.size === 0) {
        for (const token of tokens) {
            await findTrips(token, stop => trips.set(stop.id, stop), limit)
        }
    }

    const fuse = new Fuse(
        Array.from(trips.values()),
        {
            keys: ['name', 'keywords'],
            threshold: 0.4,
            useExtendedSearch: true,
        }
    )

    const result = fuse.search(transliteratedKeyword).map(result => result.item)
    if (result.length === 0 && limit !== 1000) {
        return searchTrip(keyword, 1000)
    }

    return result;
}

async function findTrips(keyword: string, each: (trip: Trip) => void, limit: number) {
    await scheduleDB.trip
        .where('keywords')
        .startsWithIgnoreCase(keyword)
        .limit(limit)
        .each(each);
}
