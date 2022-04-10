import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import cleanStack from '@cjsa/clean-stack';
const logger = winston.createLogger({
    level: process.env.NODE_PRODUTION ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '14d'
        }),

        new DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '14d'
        })

        // new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

logger.add(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.json()
        )
    })
);
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function logHttpError(url: string, error: any): void {
    if (error.stack) {
        error = cleanStack(error.stack);
    }
    logger.error({ type: 'http', url, error });
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function logDBError(error: any): void {
    if (error.stack) {
        error = cleanStack(error.stack);
    }
    logger.error({ type: 'db', error });
}

const LEVELS = new Set<string | symbol>(Object.keys(logger.levels));
export default new Proxy(logger, {
    get: (target, p) => {
        if (LEVELS.has(p)) {
            return target[p].bind(logger);
        }
        return target[p];
    }
});
