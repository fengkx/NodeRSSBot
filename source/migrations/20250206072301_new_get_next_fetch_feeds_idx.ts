import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema
        .alterTable('subscribes', (t) => {
            t.index(['feed_id']);
        })
        .alterTable('rss_feed', (t) => {
            t.index(['next_fetch_time']);
        });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema
        .alterTable('subscribes', (t) => {
            t.dropIndex(['feed_id']);
        })
        .alterTable('rss_feed', (t) => {
            t.dropIndex(['next_fetch_time']);
        });
}
