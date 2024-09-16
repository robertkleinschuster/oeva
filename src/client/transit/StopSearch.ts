import Tokenizer from "wink-tokenizer";
import {transliterate} from "transliteration";
import Fuse from "fuse.js";
import {db} from "../db/client";
import {Stop} from "../db/schema";

export async function searchStop(keyword: string, limit = 10): Promise<Stop[]> {
    const transliteratedKeyword = transliterate(keyword);
    const tokenizer = new Tokenizer()
    const tokens = tokenizer.tokenize(transliteratedKeyword).map(token => token.value.toLowerCase())

    const stops = new Map<string, Stop>()
    await findStations(transliteratedKeyword, stop => stops.set(stop.stop_id, stop), limit)

    if (stops.size === 0) {
        for (const token of tokens) {
            await findStations(token, stop => stops.set(stop.stop_id, stop), limit)
        }
    }

    if (stops.size === 0) {
        await findStops(transliteratedKeyword, stop => stops.set(stop.stop_id, stop), limit)
    }

    if (stops.size === 0) {
        for (const token of tokens) {
            await findStops(token, stop => stops.set(stop.stop_id, stop), limit)
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
    (await db
        .selectFrom('stop')
        .selectAll()
        .where('keywords', 'like', `%${keyword}%`)
        .limit(limit)
        .execute()).forEach(each)
}

async function findStations(keyword: string, each: (stop: Stop) => void, limit: number) {
    (await db
        .selectFrom('stop')
        .selectAll()
        .where('keywords', 'like', `%${keyword}%`)
        .where('feed_parent_station', 'is', null)
        .limit(limit)
        .execute()).forEach(each)
}