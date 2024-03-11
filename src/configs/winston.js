const winston = require('winston');
const path = require('path');

// Define custom colors
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'magenta',
});

// Base log file configuration to avoid repetition
const baseFileConfig = (level) => ({
  level: level,
  filename: path.join(__dirname, '..', 'logs', level, `${level}.log`),
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
    winston.format.align(),
    winston.format.printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}`),
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
    winston.format.printf((info) => `${info.level}: ${info.timestamp}: ${info.message}`),
  ),
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
      level: 'debug', // Adjust as needed for console output
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
        winston.format.align(),
        winston.format.printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}`),
      ),
      handleExceptions: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'exceptions', 'exceptions.log'),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'rejections', 'rejections.log'),
    }),
  ],
  exitOnError: false,
};

// Create and export the logger
const logger = winston.createLogger(logConfiguration);
logger.setMaxListeners(20);

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

module.exports = logger;
