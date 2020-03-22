import i18n from '../i18n';
import logger from './logger';
import { config } from '../config';

export class ControllableError extends Error {
    code: string;
    constructor(err: string) {
        super(err);
        if (err) {
            logger.error(err);
        }
    }

    toString(lang: string) {
        if (!lang) {
            lang = config.lang;
        }
        return i18n[lang][this.code];
    }
}

export function newCtrlErr(code: string, e?: any) {
    const err = new ControllableError(e);
    if (e && e.response) {
        switch (e.response.statusCode) {
            case 404:
            case 403:
                this.code = e.response.statusCode;
        }
    }
    err.code = code;
    return err;
}

export default {
    newCtrlErr,
    ControllableError
};
