import {SQLocalKysely} from 'sqlocal/kysely';
import {Kysely} from 'kysely';
import type {Database} from '../../shared/db/schema';

const {dialect} = new SQLocalKysely('database.sqlite3');
export const db = new Kysely<Database>({dialect});
