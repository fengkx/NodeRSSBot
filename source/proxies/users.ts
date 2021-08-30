import errors from '../utils/errors.js';
import { User } from '../types/user';
import { Option, Optional } from '../types/option.js';
import logger from '../utils/logger.js';
import { db } from '../database/index.js';

export async function getUserById(id: number): Promise<Option<User>> {
    try {
        const user = await db<User>('users')
            .where('user_id', id)
            .select()
            .first();
        return Optional(user);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function setLangById(id: number, lang: string): Promise<number> {
    try {
        return await db('users').where('user_id', id).update({ lang });
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function newUser(id: number, lang: string): Promise<User> {
    try {
        await db('users').insert({ user_id: id, lang }, 'user_id');
        // returning() is not support in sqlite
        return await db('users').where('user_id', id).select().first();
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function migrateUser(from: number, to: number): Promise<void> {
    try {
        await db.transaction(async (trx) => {
            await trx('users').where('user_id', from).update({ user_id: to });
            await trx('subscribes')
                .where('user_id', from)
                .update({ user_id: to });
        });
        logger.info(`migrate user from ${from} to ${to}`);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}
