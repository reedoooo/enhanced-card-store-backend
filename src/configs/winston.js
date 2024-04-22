const winston = require('winston');
require('winston-daily-rotate-file'); // This is necessary to use DailyRotateFile
const path = require('path');
require('colors');
const { format: dateFormat } = require('date-fns');
const MAX_LOG_LENGTH = 200; // Maximum length of log messages

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'magenta',
});

const timestampFormat = () => dateFormat(new Date(), 'HH:mm:ss');
const getFunctionName = () => {
  const stack = new Error().stack.split('\n')[3]; // Adjust stack level as needed.
  const match = stack.match(/at (\S+)/);
  return match ? match[1] : 'anonymous';
};
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: timestampFormat }),
  winston.format.colorize(),
  winston.format.printf((info) => {
    const fname = info.functionName ? `[${getFunctionName()}]` : '[UNKNOWN FUNCTION]';
    // let truncatedMessage =
    //   info.message.length > MAX_LOG_LENGTH
    //     ? info.message.substring(0, MAX_LOG_LENGTH) + '...'
    //     : info.message;
    return `[${info.level.toUpperCase()}][${info.timestamp}]${fname} |->| ${info.message} |<-|`;
  }),
);

const dailyRotateFileTransport = (level) => new winston.transports.DailyRotateFile({
  level: level,
  filename: path.join(__dirname, '..', 'logs', level, `${level}-%DATE%.log`),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp({ format: timestampFormat }),
    winston.format.printf(
      (info) => `[${info.level.toUpperCase()}][${info.timestamp}][${getFunctionName()}]: ${info.message}`
    ),
  ),
});
const loggerConfiguration = {
  levels: winston.config.npm.levels,
  transports: [
    ...['error', 'warn', 'info', 'verbose', 'debug', 'silly'].map(dailyRotateFileTransport),
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
      handleExceptions: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'exceptions', 'exceptions.log'),
      format: consoleFormat,
    }),
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
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
const logger = winston.createLogger(loggerConfiguration);
logger.setMaxListeners(500);

module.exports = logger;
// const baseFileConfig = (level) => ({
//   level: level,
//   filename: path.join(__dirname, '..', 'logs', level, `${level}.log`),
//   format: winston.format.combine(
//     winston.format.timestamp({ format: timestampFormat }),
//     winston.format.printf(
//       (info) => `[${info.level.toUpperCase()}]: ${info.timestamp}: ${info.message}`,
//     ),
//   ),
// });

// const loggerConfiguration = {
//   levels: winston.config.npm.levels,
//   transports: [
//     ...['error', 'warn', 'info', 'verbose', 'debug', 'silly']?.map(dailyRotateFileTransport),
//     new winston.transports.Console({
//       level: 'debug',
//       format: consoleFormat,
//       handleExceptions: true,
//     }),
//   ],
//   exceptionHandlers: [
//     new winston.transports.File({
//       filename: path.join(__dirname, '..', 'logs', 'exceptions', 'exceptions.log'),
//       format: consoleFormat,
//     }),
//     new winston.transports.Console({
//       format: consoleFormat,
//       handleExceptions: true,
//     }),
//   ],
//   rejectionHandlers: [
//     new winston.transports.File({
//       filename: path.join(__dirname, '..', 'logs', 'rejections', 'rejections.log'),
//       format: consoleFormat,
//     }),
//   ],
//   exitOnError: false,
// };
// const logger = winston.createLogger(loggerConfiguration);
// logger.setMaxListeners(500);

// if (process.env.NODE_ENV !== 'production') {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
//     }),
//   );
// }

// module.exports = logger;
// const criticalErrorTransport = new winston.transports.File({
//   level: 'error',
//   filename: path.join(__dirname, '..', 'logs', 'critical', 'critical.log'),
//   format: winston.format.combine(
//     winston.format.errors({ stack: true }),
//     winston.format.colorize(),
//     winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
//     winston.format.align(),
//     // winston.format.printf(
//     //   (info) => `${colorizeLevel(info.level)}: ${[info.timestamp]}: ${info.message}`,
//     // ),
//   ),
//   handleExceptions: true,
// });
// const baseFileConfig = (level) => ({
//   level: level,
//   filename: path.join(__dirname, '..', 'logs', level, `${level}.log`),
//   format: winston.format.combine(
//     winston.format.colorize({ all: true }),
//     winston.format.align(),
//     winston.format.cli(),
//     winston.format.timestamp({
//       format: () => dateFormat(new Date(), 'HH:mm'),
//     }),
//     // consoleFormat,
//     // winston.format.printf(
//     //   (info) => `[${info.level.toUpperCase()}]: ${info.timestamp}: ${info.message}`,
//     // ),
//   ),
// });

// Adding critical error transport with stack trace logging
// const criticalErrorTransport = new winston.transports.File({
//   level: 'error',
//   filename: path.join(__dirname, '..', 'logs', 'critical', 'critical.log'),
//   format: winston.format.combine(
//     winston.format.errors({ stack: true }),
//     winston.format.colorize(),
//     winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
//     winston.format.align(),
//     // winston.format.printf(
//     //   (info) => `${colorizeLevel(info.level)}: ${[info.timestamp]}: ${info.message}`,
//     // ),
//   ),
//   handleExceptions: true,
// });
// const loggerConfiguration = {
//   levels: winston.config.npm.levels,
//   transports: [
//     criticalErrorTransport,
//     ...['error', 'warn', 'info', 'verbose', 'debug', 'silly'].map(
//       (level) => new winston.transports.File(baseFileConfig(level)),
//     ),
//     new winston.transports.Console({
//       level: 'debug',
//       format: consoleFormat,
//       handleExceptions: true,
//     }),
//   ],
//   exceptionHandlers: [
//     new winston.transports.File({
//       filename: path.join(__dirname, '..', 'logs', 'exceptions', 'exceptions.log'),
//       format: consoleFormat,
//     }),
//     new winston.transports.Console({
//       format: consoleFormat,
//       handleExceptions: true,
//     }),
//   ],
//   rejectionHandlers: [
//     new winston.transports.File({
//       filename: path.join(__dirname, '..', 'logs', 'rejections', 'rejections.log'),
//       format: consoleFormat,
//     }),
//   ],
//   exitOnError: false,
// };
// const logger = winston.createLogger(loggerConfiguration);
// logger.setMaxListeners(500);

// if (process.env.NODE_ENV !== 'production') {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
//     }),
//   );
// }

// module.exports = logger;

// Logger configuration
// const logConfiguration = {
//   levels: winston.config.npm.levels,
//   transports: [
//     criticalErrorTransport,
//     new winston.transports.File(baseFileConfig('error')),
//     new winston.transports.File(baseFileConfig('warn')),
//     new winston.transports.File(baseFileConfig('info')),
//     new winston.transports.File(baseFileConfig('verbose')),
//     new winston.transports.File(baseFileConfig('debug')),
//     new winston.transports.File(baseFileConfig('silly')),
//     new winston.transports.Console({
//       level: 'debug',
//       format: consoleFormat,
//       handleExceptions: true,
//     }),
//   ],
//   exceptionHandlers: [
//     new winston.transports.File({
//       filename: path.join(__dirname, '..', 'logs', 'exceptions', 'exceptions.log'),
//       // format: consoleFormat,
//     }),
//     new winston.transports.Console({
//       format: consoleFormat,
//       handleExceptions: true,
//     }),
//   ],
//   rejectionHandlers: [
//     new winston.transports.File({
//       filename: path.join(__dirname, '..', 'logs', 'rejections', 'rejections.log'),
//       format: consoleFormat,
//     }),
//   ],
//   exitOnError: false,
// };

// Create and export the logger
