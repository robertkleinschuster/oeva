import {Kysely, Migration} from 'kysely';
import {Database} from "../schema";

export const initial1: Migration = {
    async up(db: Kysely<Database>): Promise<void> {
        await db.schema
            .createTable('stop')
            .addColumn('stop_id', 'text', (col) => col.primaryKey())
            .addColumn('feed_name', 'text', (col) => col.notNull())
            .addColumn('feed_parent_station', 'text')
            .addColumn('stop_name', 'text', (col) => col.notNull())
            .addColumn('platform', 'text')
            .addColumn('h3_cell', 'text', (col) => col.notNull())
            .addColumn('lat', 'integer', (col) => col.notNull())
            .addColumn('lon', 'integer', (col) => col.notNull())
            .addColumn('keywords', 'text', (col) => col.notNull())
            .addColumn('last_used', 'integer')
            .addColumn('favorite_order', 'integer')
            .execute();

        await db.schema
            .createIndex('i_s_h3')
            .on('stop')
            .column('h3_cell')
            .execute();

        await db.schema
            .createIndex('i_s_coord')
            .on('stop')
            .columns(['lat', 'lon'])
            .execute();

        await db.schema
            .createIndex('i_s_keywords')
            .on('stop')
            .columns(['keywords'])
            .execute();

        await db.schema
            .createIndex('i_s_last_used')
            .on('stop')
            .columns(['last_used'])
            .execute();

        await db.schema
            .createIndex('i_s_favorite_order')
            .on('stop')
            .columns(['favorite_order'])
            .execute();

        await db.schema.createTable('service')
            .addColumn('service_id', 'text', col => col.primaryKey())
            .addColumn('feed_id', 'integer', (col) => col.notNull())
            .addColumn('monday', 'boolean', col => col.notNull())
            .addColumn('tuesday', 'boolean', col => col.notNull())
            .addColumn('wednesday', 'boolean', col => col.notNull())
            .addColumn('thursday', 'boolean', col => col.notNull())
            .addColumn('friday', 'boolean', col => col.notNull())
            .addColumn('saturday', 'boolean', col => col.notNull())
            .addColumn('sunday', 'boolean', col => col.notNull())
            .addColumn('start_date', 'integer', col => col.notNull())
            .addColumn('end_date', 'integer', col => col.notNull())
            .execute()

        await db.schema
            .createIndex('i_svc_date')
            .on('service')
            .columns(['start_date', 'end_date'])
            .execute()

        await db.schema
            .createIndex('i_svc_week')
            .on('service')
            .columns(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
            .execute()

        await db.schema
            .createIndex('i_svc_feed')
            .on('service')
            .column('feed_id')
            .execute()

        await db.schema
            .createTable('exception')
            .addColumn('exception_id', 'integer', col => col.primaryKey().autoIncrement())
            .addColumn('service_id', 'text', (col) => col.references('service.service_id').onDelete('cascade').notNull())
            .addColumn('date', 'integer', (col) => col.notNull())
            .addColumn('type', 'integer', (col) => col.notNull())
            .addForeignKeyConstraint('fk_e_service', ['service_id'], 'service', ['service_id'], c => c.onDelete('cascade'))
            .execute()

        await db.schema
            .createIndex('uk_exception')
            .unique()
            .on('exception')
            .columns(['service_id', 'date', 'type'])
            .execute()

        await db.schema
            .createTable('trip')
            .addColumn('trip_id', 'text', (col) => col.primaryKey())
            .addColumn('service_id', 'text', col => col.references('service.service_id').onDelete('cascade').notNull())
            .addColumn('feed_name', 'text', (col) => col.notNull())
            .addColumn('feed_trip_id', 'text', (col) => col.notNull())
            .addColumn('trip_name', 'text', (col) => col.notNull())
            .addColumn('line', 'text')
            .addColumn('number', 'text')
            .addColumn('category', 'text')
            .addColumn('direction', 'text', (col) => col.notNull())
            .addColumn('route_type', 'integer', (col) => col.notNull())
            .addColumn('keywords', 'text', (col) => col.notNull())
            .addForeignKeyConstraint('fk_t_service', ['service_id'], 'service', ['service_id'], c => c.onDelete('cascade'))
            .execute();

        await db.schema
            .createIndex('i_t_number')
            .on('trip')
            .columns(['number'])
            .execute();

        await db.schema
            .createIndex('i_t_keywords')
            .on('trip')
            .columns(['keywords'])
            .execute();

        await db.schema
            .createTable('trip_stop')
            .addColumn('trip_stop_id', 'text', (col) => col.primaryKey())
            .addColumn('stop_id', 'text', (col) => col.references('stop.stop_id').onDelete('cascade').notNull())
            .addColumn('trip_id', 'text', (col) => col.references('trip.trip_id').onDelete('cascade').notNull())
            .addColumn('hour', 'integer', col => col.notNull())
            .addColumn('sequence_in_trip', 'integer', (col) => col.notNull())
            .addColumn('sequence_at_stop', 'integer', (col) => col.notNull())
            .addColumn('departure_time', 'integer')
            .addColumn('arrival_time', 'integer')
            .addColumn('boarding', 'integer', (col) => col.notNull())
            .addColumn('is_origin', 'boolean', (col) => col.notNull())
            .addColumn('is_destination', 'boolean', (col) => col.notNull())
            .addForeignKeyConstraint('fk_ts_stop', ['stop_id'], 'stop', ['stop_id'], c => c.onDelete('cascade'))
            .addForeignKeyConstraint('fk_ts_trip', ['trip_id'], 'trip', ['trip_id'], c => c.onDelete('cascade'))
            .execute();

        await db.schema
            .createIndex('i_ts_time')
            .on('trip_stop')
            .columns(['departure_time', 'arrival_time'])
            .execute();

        await db.schema
            .createIndex('i_ts_hour')
            .on('trip_stop')
            .column('hour')
            .execute();
    },

    async down(db: Kysely<Database>): Promise<void> {
        await db.schema.dropTable('trip_stop').execute();
        await db.schema.dropTable('trip').execute();
        await db.schema.dropTable('stop').execute();
        await db.schema.dropTable('exception').execute();
        await db.schema.dropTable('service').execute();
    }
}