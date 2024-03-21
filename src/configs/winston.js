const winston = require('winston');
const path = require('path');
require('colors');

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'magenta',
});

const colorizeLevel = (level) => {
  switch (level) {
    case 'info':
      return `[${level.toUpperCase()}]`.blue;
    case 'error':
      return `[${level.toUpperCase()}]`.red;
    case 'warn':
      return `[${level.toUpperCase()}]`.yellow;
    default:
      return `[${level.toUpperCase()}]`;
  }
};

// Custom format for console logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
  winston.format.colorize({
    all: true, // Colorize the entire message
  }),
  winston.format.printf(
    (info) => `[${info.level.toUpperCase()}]: ${info.timestamp}: ${info.message}`,
  ),
);

const baseFileConfig = (level) => ({
  level: level,
  filename: path.join(__dirname, '..', 'logs', level, `${level}.log`),
  format: winston.format.combine(
    // winston.format.cli(),
    // winston.format.colorize(),
    // winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
    // winston.format.align(),
    // winston.format.printf(
    //   (info) => `${colorizeLevel(info.level)}: ${[info.timestamp]}: ${info.message}`,
    // ),
    winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
    winston.format.printf(
      (info) => `[${info.level.toUpperCase()}]: ${info.timestamp}: ${info.message}`,
    ),
  ),
});

// Adding critical error transport with stack trace logging
const criticalErrorTransport = new winston.transports.File({
  level: 'error',
  filename: path.join(__dirname, '..', 'logs', 'critical', 'critical.log'),
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
    winston.format.align(),
    winston.format.printf(
      (info) => `${colorizeLevel(info.level)}: ${[info.timestamp]}: ${info.message}`,
    ),
  ),
  handleExceptions: true,
});

// Logger configuration
const logConfiguration = {
  levels: winston.config.npm.levels,
  transports: [
    criticalErrorTransport,
    new winston.transports.File(baseFileConfig('error')),
    new winston.transports.File(baseFileConfig('warn')),
    new winston.transports.File(baseFileConfig('info')),
    new winston.transports.File(baseFileConfig('verbose')),
    new winston.transports.File(baseFileConfig('debug')),
    new winston.transports.File(baseFileConfig('silly')),
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
      handleExceptions: true,
    }),
    // new winston.transports.Console({
    //   level: 'debug', // Adjust as needed for console output
    //   format: winston.format.combine(
    //     winston.format.colorize(),
    //     winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
    //     winston.format.align(),
    //     winston.format.printf(
    //       (info) => `${colorizeLevel(info.level)}: ${[info.timestamp]}: ${info.message}`,
    //     ),
    //   ),
    //   handleExceptions: true,
    // }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'exceptions', 'exceptions.log'),
      format: consoleFormat,
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'rejections', 'rejections.log'),
      format: consoleFormat,
    }),
  ],
  exitOnError: false,
};

// Create and export the logger
const logger = winston.createLogger(logConfiguration);
logger.setMaxListeners(50);

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

module.exports = logger;
