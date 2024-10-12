import {SQLocalKysely} from 'sqlocal/kysely';
import {InsertObject, Kysely} from 'kysely';
import type {Database} from './schema';

const {dialect} = new SQLocalKysely('database.sqlite3');
export const db = new Kysely<Database>({dialect});

export async function bulkReplaceInto<T extends keyof Database & string>(table: T, values: InsertObject<Database, T>[], progress?: (remaining: number) => void): Promise<void> {
    while (values.length) {
        await db.replaceInto(table)
            .values(values.splice(0, 1000))
            .execute()
        if (progress) {
            progress(values.length)
        }
    }
}