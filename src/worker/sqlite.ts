import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type {Sqlite3Static} from '@sqlite.org/sqlite-wasm';

const log = console.log;
const error = console.error;

const start = (sqlite3: Sqlite3Static) => {
    log('Running SQLite3 version', sqlite3.version.libVersion);
    const db =
        'opfs' in sqlite3
            ? new sqlite3.oo1.OpfsDb('/mydb.sqlite3')
            : new sqlite3.oo1.DB('/mydb.sqlite3', 'ct');
    log(
        'opfs' in sqlite3
            ? `OPFS is available, created persisted database at ${db.filename}`
            : `OPFS is not available, created transient database ${db.filename}`,
    );


    // Your SQLite code here.
    // db.exec("CREATE TABLE example (id INTEGER PRIMARY KEY,name TEXT,age INTEGER);")
    // db.exec("INSERT INTO example (name, age) VALUES ('Alice', 30);");
    // db.exec("INSERT INTO example (name, age) VALUES ('Bob', 25);");
    // db.exec("INSERT INTO example (name, age) VALUES ('Charlie', 35);");

    const stmt = db.prepare('SELECT * FROM example;')
    while (stmt.step()) {
        console.log(stmt.get(0), stmt.get(1))
    }
};



const initializeSQLite = async () => {
    try {
        log('Loading and initializing SQLite3 module...');
        const sqlite3 = await sqlite3InitModule({print: log, printErr: error});
        log('Done initializing. Running demo...');
        start(sqlite3);
    } catch (err) {
        error('Initialization error:', err);
    }
};

void initializeSQLite();
