const errors = require('../utils/errors');
const dbPromise = require('../database');

const px = {};

px.getUserById = async (id) => {
    try {
        const db = await dbPromise;
        return await db.get(`SELECT * FROM users WHERE user_id=?`, id);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.setLangById = async (id, lang) => {
    try {
        const db = await dbPromise;
        const sql = `UPDATE users
                     SET lang=?
                     WHERE user_id = ?`;
        await db.run(sql, lang, id);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.newUser = async (id, lang) => {
    try {
        const db = await dbPromise;
        const sql = `INSERT INTO users (user_id, lang) VALUES(?, ?)`;
        await db.run(sql, id, lang);
        return db.get(`SELECT * FROM users WHERE user_id=?`, id);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

module.exports = px;
