import {SQLocalKysely} from 'sqlocal/kysely';
import {InsertObject, Kysely} from 'kysely';
import type {Database} from './schema';

const {dialect} = new SQLocalKysely('database.sqlite3');
export const db = new Kysely<Database>({dialect});

export async function bulkReplaceInto<T extends keyof Database & string>(table: T, values: InsertObject<Database, T>[], progress?: (saved: number) => void): Promise<void> {
    await db.transaction().execute(async trx => {
        let saved = 0
        while (values.length) {
            await trx.replaceInto(table)
                .values(values.splice(0, 1000))
                .execute()
            saved += 1000
            if (progress) {
                progress(saved)
            }
        }
    })
}