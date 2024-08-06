import i18n from '../i18n';
import logger, { logDBError } from './logger';
import { config } from '../config';

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
