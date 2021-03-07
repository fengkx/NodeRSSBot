import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('rss_feed', function (t) {
        t.dateTime('next_fetch_time', { useTz: false }).defaultTo(
            '1970-01-01 00:00:00.000'
        );
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('rss_feed', function (t) {
        t.dropColumn('next_fetch_time');
    });
}
