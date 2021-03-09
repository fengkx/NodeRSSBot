import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('rss_feed', function (t) {
        t.text('last_modified_header').defaultTo('');
        t.text('etag_header').defaultTo('');
        t.integer('ttl').defaultTo(0);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('rss_feed', function (t) {
        t.dropColumn('last_modified_header');
        t.dropColumn('etag_header');
        t.dropColumn('ttl');
    });
}
