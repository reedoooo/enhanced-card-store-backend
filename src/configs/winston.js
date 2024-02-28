const winston = require('winston');
const path = require('path');

// Logger configuration
const logConfiguration = {
  transports: [
    new winston.transports.File({
      level: 'error',
      filename: path.join(__dirname, '..', 'logs', 'error', 'error.log'),
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'MMM-DD-YYYY HH:mm:ss',
        }),
        winston.format.align(),
        winston.format.printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}`),
      ),
    }),
    new winston.transports.File({
      level: 'info',
      filename: path.join(__dirname, '..', 'logs', 'info', 'info.log'),
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'MMM-DD-YYYY HH:mm:ss',
        }),
        winston.format.align(),
        winston.format.printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}`),
      ),
    }),
    new winston.transports.Console({
      level: 'info',
      filename: path.join(__dirname, '..', 'logs', 'access', 'access.log'),
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'MMM-DD-YYYY HH:mm:ss',
        }),
        winston.format.align(),
        winston.format.printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}`),
      ),
      handleExceptions: true,
      humanReadableUnhandledException: true,
    }),
    new winston.transports.File({
      level: 'debug',
      filename: path.join(__dirname, '..', 'logs', 'debug', 'debug.log'),
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'MMM-DD-YYYY HH:mm:ss',
        }),
        winston.format.align(),
        winston.format.printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}`),
      ),
    }),
  ],
  exitOnError: false,
};

// Create the logger
const logger = winston.createLogger(logConfiguration);

module.exports = logger;
