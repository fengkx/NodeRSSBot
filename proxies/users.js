const errors = require('../utils/errors');
const dbPool = require('../database');

// eslint-disable-next-line no-empty-function
const placeHolder = { release() {} };
const px = {};

px.getUserById = async (id) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        return db.prepare(`SELECT * FROM users WHERE user_id=?`).get(id);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.setLangById = async (id, lang) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const sql = `UPDATE users
                     SET lang=?
                     WHERE user_id = ?`;
        db.prepare(sql).run(lang, id);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.newUser = async (id, lang) => {
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
};

module.exports = px;
