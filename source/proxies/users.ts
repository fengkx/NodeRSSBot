import dbPool from '../database';
import errors from '../utils/errors';
import { User } from '../types/user';
import * as Database from 'better-sqlite3';
import { Option, Optional } from '../types/option';
import logger from '../utils/logger';

// eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
const placeHolder: any = { available: false, release() {} };

export async function getUserById(id: number): Promise<Option<User>> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        return Optional(
            db.prepare(`SELECT * FROM users WHERE user_id=?`).get(id)
        );
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function setLangById(
    id: number,
    lang: string
): Promise<Database.RunResult> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const sql = `UPDATE users
                     SET lang=?
                     WHERE user_id = ?`;
        return db.prepare(sql).run(lang, id);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function newUser(id: number, lang: string): Promise<User> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const sql = `INSERT INTO users (user_id, lang) VALUES(?, ?)`;
        db.prepare(sql).run(id, lang);
        return db.prepare(`SELECT * FROM users WHERE user_id=?`).get(id);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function migrateUser(from: number, to: number): Promise<void> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const updateUserTable = db.prepare(
            `UPDATE users SET user_id=? WHERE user_id=?`
        );
        const updateSubscribesTable = db.prepare(
            `UPDATE subscribes SET user_id=? WHERE user_id=?`
        );
        const migrate = db.transaction((from: number, to: number) => {
            updateUserTable.run(to, from);
            updateSubscribesTable.run(to, from);
        });
        migrate(from, to);
        logger.info(`migrate user from ${from} to ${to}`);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}
