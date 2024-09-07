import {Stop} from "../db/Schedule";
import Tokenizer from "wink-tokenizer";
import {transliterate} from "transliteration";
import {scheduleDB} from "../db/ScheduleDB";
import Fuse from "fuse.js";

export async function searchStop(keyword: string, limit = 10): Promise<Stop[]> {
    const transliteratedKeyword = transliterate(keyword);
    const tokenizer = new Tokenizer()
    const tokens = tokenizer.tokenize(transliteratedKeyword).map(token => token.value.toLowerCase())

    const stops = new Map<string, Stop>()
    await findStations(transliteratedKeyword, stop => stops.set(stop.id, stop), limit)

    if (stops.size === 0) {
        for (const token of tokens) {
            await findStations(token, stop => stops.set(stop.id, stop), limit)
        }
    }

    if (stops.size === 0) {
        await findStops(transliteratedKeyword, stop => stops.set(stop.id, stop), limit)
    }

    if (stops.size === 0) {
        for (const token of tokens) {
            await findStops(token, stop => stops.set(stop.id, stop), limit)
        }
    }

    const fuse = new Fuse(
        Array.from(stops.values()),
        {
            keys: ['name', 'keywords'],
            threshold: 0.4,
            useExtendedSearch: true,
        }
    )

    const result = fuse.search(transliteratedKeyword).map(result => result.item)
    if (result.length === 0 && limit !== 1000) {
        return searchStop(keyword, 1000)
    }

    return result;
}

async function findStops(keyword: string, each: (stop: Stop) => void, limit: number) {
    await scheduleDB.stop
        .where('keywords')
        .startsWith(keyword)
        .limit(limit)
        .each(each);
}

async function findStations(keyword: string, each: (stop: Stop) => void, limit: number) {
    await scheduleDB.stop
        .where('keywords')
        .startsWith(keyword)
        .filter(stop => !stop.feed_parent_station)
        .limit(limit)
        .each(each);
}