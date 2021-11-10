import i18n from '../i18n.js';
import logger, { logDBError } from './logger.js';
import { config } from '../config.js';

export class ControllableError extends Error {
    code: string;
    constructor(err: string, code: string) {
        super(err);
        this.code = code;
        if (err) {
            if (code === 'DB_ERROR') {
                logDBError(err);
            } else {
                logger.error(err);
            }
        }
    }

    toString(lang: string): string {
        if (!lang) {
            lang = config.lang;
        }
        return i18n[lang][this.code];
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newCtrlErr(code: string, e?: any): Error {
    if (e && e.response) {
        switch (e.response.statusCode) {
            case 404:
            case 403:
                code = e.response.statusCode;
        }
    }
    const err = new ControllableError(e, code);
    return err;
}

export default {
    newCtrlErr,
    ControllableError
};
