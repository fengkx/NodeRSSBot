import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema
        .createTable('rss_feed', function (table) {
            table.increments('feed_id');
            table
                .text('url')
                .notNullable()
                .unique()
                .comment('urldecoded feed url');
            table.text('feed_title').notNullable().comment('feed title');
            table.text('recent_hash_list').defaultTo('[]').notNullable();
            table.integer('error_count').defaultTo(0).notNullable();
        })
        .createTable('subscribes', function (table) {
            table.increments('subscribe_id');
            table
                .integer('feed_id')
                .notNullable()
                .references('feed_id')
                .inTable('rss_feed')
                .onDelete('CASCADE');
            table.integer('user_id').notNullable();
            table.unique(['feed_id', 'user_id']);
        })
        .createTable('users', function (table) {
            table.increments('user_id');
            table.text('lang').notNullable();
        });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema
        .dropTableIfExists('rss_feed')
        .dropTableIfExists('subscribes')
        .dropTableIfExists('users');
}
