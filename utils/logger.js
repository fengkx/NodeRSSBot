const winston = require('winston');
require('winston-daily-rotate-file');

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

        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            level: 'error',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '30m',
            maxFiles: '14d'
        }),

        new winston.transports.DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
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
            winston.format.simple()
        )
    })
);
module.exports = logger;
