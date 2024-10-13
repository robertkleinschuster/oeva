import {Kysely} from 'kysely';
import type {Database} from '../../shared/db/schema';
import {OfficialWasmDB, OfficialWasmDialect} from "kysely-wasm";
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const dialect = new OfficialWasmDialect({
    database: async () => {
        const sqlite3 = (await sqlite3InitModule()).oo1
        return new sqlite3.OpfsDb('database.sqlite3', 'c') as OfficialWasmDB
    },
});

export const db = new Kysely<Database>({dialect});
