const i18n = require('../i18n');
import logger from './logger';
export class ControllableError extends Error {
    code: string;
    constructor(err) {
        super(err);
        if (err) {
            logger.error(err);
        }
    }

    toString(lang) {
        return i18n[lang][this.code];
    }
}

export function newCtrlErr(code, e?: any) {
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
