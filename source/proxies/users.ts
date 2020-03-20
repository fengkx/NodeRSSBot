import dbPool from "../database";
import errors from "../utils/errors";
import {User} from "../types/user";
import * as Database from "better-sqlite3";

// eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
const placeHolder: any = { available: false, release() {} };

export async function getUserById (id: number): Promise<User> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        return db.prepare(`SELECT * FROM users WHERE user_id=?`).get(id);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function setLangById (id: number, lang: string): Promise<Database.RunResult> {
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

export async function newUser (id: number, lang: string): Promise<User> {
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
