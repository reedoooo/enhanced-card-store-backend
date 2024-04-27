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
const getDateFromStamp = (timestamp) => dateFormat(new Date(timestamp), 'yyyy-MM-dd');
const timestampFormat = () => dateFormat(new Date(), 'HH:mm');
const getFunctionName = () => {
  const stack = new Error().stack.split('\n')[3]; // Adjust stack level as needed.
  const match = stack.match(/at (\S+)/);
  return match ? match[1] : 'anonymous';
};
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: timestampFormat }),
  winston.format.printf((info) => {
    // let truncatedMessage =
    //   info.message.length > MAX_LOG_LENGTH
    //     ? info.message.substring(0, MAX_LOG_LENGTH) + '...'
    //     : info.message;
    return `[${info.level}][${info.timestamp}] |->| ${info.message} |<-|`;
  }),
);

const loggerConfiguration = {
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.Console({
      // level: 'debug',
      format: consoleFormat,
      handleExceptions: true,
    }),
    new winston.transports.DailyRotateFile({
      // level: level,
      // filename: path.join(__dirname, '..', 'logs', level, `${level}-%DATE%.log`),
      filename: path.join(__dirname, 'logs', '%DATE%-results.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        // winston.format.colorize(),
        winston.format.timestamp({ format: timestampFormat }),
        winston.format.printf(
          (info) => `[${info.level.toUpperCase()}][${info.timestamp}]: ${info.message}`,
        ),
      ),
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
const testLogger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

testLogger.error('This is a red error message');
testLogger.warn('This is a yellow warning message');
testLogger.info('This is a blue info message');

logger.setMaxListeners(500);

module.exports = logger;
