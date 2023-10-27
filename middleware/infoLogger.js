const winston = require('winston');
require('winston-daily-rotate-file');

const format = winston.format;
const logLevel = process.env.LOG_LEVEL || 'info';

// Common timestamp format
const timestampFormat = format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });

// Custom format for console output
const consoleFormat = format.combine(
  format.colorize(),
  timestampFormat,
  format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

// Transport configuration
const dailyRotateFileOptions = {
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
};

const transports = {
  dailyRotate: new winston.transports.DailyRotateFile({
    filename: 'application-%DATE%.log',
    ...dailyRotateFileOptions,
  }),
  errorDailyRotate: new winston.transports.DailyRotateFile({
    filename: 'error-%DATE%.log',
    level: 'error',
    ...dailyRotateFileOptions,
  }),
  console: new winston.transports.Console({ format: consoleFormat }),
};

// Main Logger
const logger = winston.createLogger({
  level: logLevel,
  format: format.combine(timestampFormat, format.json()),
  defaultMeta: { service: 'user-service' },
  transports: [transports.dailyRotate, transports.errorDailyRotate, transports.console],
});
// Ensure at least one transport is always available
if (logger.transports.length === 0) {
  logger.add(transports.console);
}
// Custom logger functions
logger.errorLogger = (message, error) => {
  logger.error(message, { error: error.toString(), stack: error.stack });
};

logger.infoLogger = (message, data) => {
  logger.info(message, { data });
};

logger.debugLogger = (message, data) => {
  logger.debug(message, { data });
};

// Additional Loggers
const createAdditionalLogger = (filename) =>
  winston.createLogger({
    level: 'info',
    format: format.combine(timestampFormat, format.json()),
    transports: [
      new winston.transports.DailyRotateFile({
        filename: `${filename}-%DATE%.log`,
        ...dailyRotateFileOptions,
      }),
    ],
  });

const cardPriceLogger = createAdditionalLogger('cardPrices');
const cronJobLogger = createAdditionalLogger('cronJobs');
const errorLogger = createAdditionalLogger('errors');
const responseLogger = createAdditionalLogger('responses');

// Function to log chart data details
function logChartDataDetails(label, data) {
  cardPriceLogger.info(`[CHART DATA] ${label}: ${JSON.stringify(data)}`);
}

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  const loggers = [logger, cardPriceLogger, cronJobLogger, errorLogger, responseLogger];
  loggers.forEach((lgr) => lgr.add(transports.console));
}

module.exports = {
  logger,
  cardPriceLogger,
  cronJobLogger,
  errorLogger,
  logChartDataDetails,
  responseLogger,
};
