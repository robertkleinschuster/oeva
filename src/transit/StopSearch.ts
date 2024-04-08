import {Stop} from "../db/Schedule";
import Tokenizer from "wink-tokenizer";
import {transliterate} from "transliteration";
import {scheduleDB} from "../db/ScheduleDB";
import Fuse from "fuse.js";

export async function searchStop(keyword: string): Promise<Stop[]> {
    const transliteratedKeyword = transliterate(keyword);
    const tokenizer = new Tokenizer()
    const tokens = tokenizer.tokenize(transliteratedKeyword).map(token => token.value)

    const stops = new Map<string, Stop>()
    await findStations(transliteratedKeyword, stop => stops.set(stop.id, stop))

    if (stops.size === 0) {
        for (const token of tokens) {
            await findStations(token, stop => stops.set(stop.id, stop))
        }
    }

    if (stops.size === 0) {
        await findStops(transliteratedKeyword, stop => stops.set(stop.id, stop))
    }

    if (stops.size === 0) {
        for (const token of tokens) {
            await findStops(token, stop => stops.set(stop.id, stop))
        }
    }

    if (tokens.length === 1 && stops.size > 500) {
        return Promise.resolve([])
    }

    const fuse = new Fuse(
        Array.from(stops.values()),
        {
            keys: ['name', 'keywords'],
            threshold: 0.4,
            useExtendedSearch: true,
        }
    )
    return fuse.search(transliteratedKeyword).map(result => result.item)
}

async function findStops(keyword: string, each: (stop: Stop) => void)
{
    await scheduleDB.stop
        .where('keywords')
        .startsWithIgnoreCase(keyword)
        .each(each);
}

async function findStations(keyword: string, each: (stop: Stop) => void)
{
    await scheduleDB.stop
        .where('keywords')
        .startsWithIgnoreCase(keyword)
        .each(stop => {
            if (!stop.feed_parent_station) {
                each(stop)
            }
        });
}