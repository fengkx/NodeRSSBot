import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', function (t) {
        t.unique(['user_id']);
        t.index(['user_id', 'lang']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', function (t) {
        t.dropUnique(['user_id']);
        t.dropIndex(['user_id', 'lang']);
    });
}
