const winston = require('winston');
require('winston-daily-rotate-file');
const { createLogger, format, transports } = winston;

const defaultLogLevel = 'error';
const logsDir = './logs';

// Custom format for console logs
const consoleFormat = format.combine(
  format.timestamp(),
  format.printf(({ level, message, timestamp, meta }) => {
    let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    // Additional formatting for 'meta' if present
    if (meta) {
      formattedMessage += ` | Section: ${meta.section}`;
      if (meta.data) {
        const dataString = Object.entries(meta.data)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ');
        formattedMessage += ` | Data: {${dataString}}`;
      }
    }
    return formattedMessage;
  }),
);

// Transport for file logs
const fileTransport = (label) =>
  new transports.DailyRotateFile({
    filename: `${logsDir}/${label}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: format.combine(format.timestamp(), format.json()),
  });

// Create transport sets
const createTransports = (label, level) => [
  new transports.Console({
    level,
    format: consoleFormat,
  }),
  fileTransport(label),
];

// Create logger with transports
const createLoggerWithTransports = (label, level = process.env['LOG_LEVEL'] || defaultLogLevel) =>
  createLogger({ level, transports: createTransports(label, level) });

// Initialize specialized loggers
const initSpecializedLoggers = () => {
  const sections = [
    'collection',
    'cardPrice',
    'cronjob',
    'error',
    'request',
    'response',
    'general',
    'decks',
    'errors',
    'warn',
    'info',
    'log',
    'user',
    'validateXY',
    'validateDataset',
    'console',
    'file',
    'end',
    'start',
  ];
  return sections.reduce((acc, section) => {
    acc[section] = createLoggerWithTransports(section);
    return acc;
  }, {});
};

const specializedLoggers = initSpecializedLoggers();

// Log to all specialized loggers
function logToAllSpecializedLoggers(level, message, meta, action) {
  const logger =
    specializedLoggers[meta?.section] || createLoggerWithTransports(meta?.section, level);
  logger.log({ level, message, ...meta });

  if (meta?.error instanceof Error) {
    logger.log({ level: 'error', message: meta.error.message, ...meta });
    if (meta.error.stack) {
      logger.log({ level: 'error', message: meta.error.stack, ...meta, stack: true });
    }
  }

  if (action === 'response') {
    respondToClient(meta.res, meta.status, message, meta.data || {});
  } else if (action === 'log') {
    specializedLoggers.console.log({ level, message, ...meta });
  } else if (action === 'file') {
    specializedLoggers.file.log({ level, message, ...meta });
  }
}

// Helper function to respond to client
function respondToClient(res, status, message, data = {}) {
  if (res.headersSent) return;
  res.status(status).json({ message, data });
}

const priceLogger = createLoggerWithTransports(
  'price',
  process.env['PRICE_LOG_LEVEL'] || defaultLogLevel,
);

module.exports = {
  loggers: specializedLoggers,
  logger: specializedLoggers.general,
  logToAllSpecializedLoggers,
  respondToClient,
  fileTransport,
  createTransports,
  createLoggerWithTransports,
  initSpecializedLoggers,
  priceLogger,
};
// /* eslint-disable prettier/prettier */
// const winston = require('winston');
// require('winston-daily-rotate-file');
// const colors = require('colors');
// const {
//   createLogger,
//   format: { combine, timestamp, printf, colorize, json },
//   transports,
// } = winston;

// const defaultLogLevel = 'error';
// const logsDir = './logs';
// const levelColors = {
//   error: '\x1b[31m', // Red
//   warn: '\x1b[33m', // Yellow
//   info: '\x1b[32m', // Green
//   verbose: '\x1b[36m', // Cyan
//   debug: '\x1b[35m', // Magenta
//   silly: '\x1b[37m', // White
//   log: '\x1b[37m', // White
// };
// // eslint-disable-next-line no-undef
// colors.setTheme(levelColors);

// // Utility to check if a key should be colored, and colorize it if so
// const colorizeKey = (key, value, colorCode) => {
//   const keysToColor = [
//     'chartData',
//     'datasets',
//     'xys',
//     'allXYValues',
//     '_id',
//     'userId',
//     'name',
//     'description',
//     'totalPrice',
//     'quantity',
//     'totalQuantity',
//     'allCardPrices',
//     'cards',
//     'currentChartDataSets',
//     'currentChartDataSets2',
//     '__v',

//     // cronjob keys
//     'testedItemCount',
//     'itemsWithoutValidID',
//     'cardsWithChangedPrices',
//     'pricingData',
//     'pricesUpdated',
//     'priceDifference',
//     'priceChange',
//     'allUpdatedCards',
//     'price',
//     'quantity',
//     'totalQuantity',
//     'allCardPrices',
//   ];
//   const colorReset = '\x1b[0m';
//   const color = colorCode || '\x1b[34m'; // Default to blue
//   return keysToColor.includes(key) ? `${color}${key}${colorReset}: ${value}` : `${key}: ${value}`;
// };
// const primaryLogLevels = ['error', 'warn', 'info', 'log', 'verbose', 'debug', 'silly'];

// const colorizeMessage = (level, message) => {
//   // const color = levelColors[level] || '\x1b[37m'; // Default to white if not found
//   const color = levelColors[level] || '\x1b[37m'; // Default to white if not found
//   const colorReset = '\x1b[0m';
//   return `${color}${message}${colorReset}`;
// };

// // Array of primary log levels

// // Enhanced consoleFormat using colorizeMessage for color coding based on log level
// // To use this format, pass in the required parameters when creating your logger using
// const consoleFormat = printf(({ level, message, timestamp, meta }) => {
//   const coloredLevel = colorizeMessage(level, level.toUpperCase());
//   const coloredMessage = colorizeMessage(level, message);
//   let formattedMessage = `[${timestamp}] ${coloredLevel}: ${coloredMessage}`;

//   // Additional formatting for 'meta' if present
//   if (meta) formattedMessage += ` | Section: ${meta.section}`;
//   if (meta && meta.data) {
//     const dataString = Object.entries(meta.data)
//       .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
//       .join(', ');
//     formattedMessage += ` | Data: {${dataString}}`;
//   }
//   return formattedMessage;
// });

// // Simplified file transport creation
// const fileTransport = (label) =>
//   new transports.DailyRotateFile({
//     filename: `${logsDir}/${label}-%DATE%.log`,
//     datePattern: 'YYYY-MM-DD',
//     zippedArchive: true,
//     maxSize: '20m',
//     maxFiles: '14d',
//     format: combine(timestamp(), json()),
//   });

// // Create transport sets with DRY principle in mind
// const createTransports = (label, level) => [
//   new transports.Console({
//     level,
//     format: combine(
//       timestamp(),
//       colorize({ all: true }),
//       printf(({ level, message, timestamp }) => {
//         return `[${timestamp}] ${level}: ${message}`;
//       }),
//     ),
//   }),
//   fileTransport(label),
// ];

// const createLoggerWithTransports = (label, level = process.env['LOG_LEVEL'] || defaultLogLevel) =>
//   createLogger({ level, transports: createTransports(label, level) });

// const initSpecializedLoggers = () => {
//   const sections = [
//     'collection',
//     'cardPrice',
//     'cronjob',
//     'error',
//     'request',
//     'response',
//     'general',
//     'decks',
//     'errors',
//     'warn',
//     'info',
//     'log',
//     'user',
//     'validateXY',
//     'validateDataset',
//     'console',
//     'file',
//     'end',
//     'start',
//   ];
//   return sections.reduce((acc, section) => {
//     acc[section] = createLoggerWithTransports(section);
//     return acc;
//   }, {});
// };

// const specializedLoggers = initSpecializedLoggers();
// function logToAllSpecializedLoggers(level, message, meta, action) {
//   const logger =
//     specializedLoggers[meta?.section] || createLoggerWithTransports(meta?.section, level);
//   logger.log({ level, message, ...meta });

//   if (meta?.error instanceof Error) {
//     logger.log({ level: 'error', message: meta.error.message, ...meta });
//     if (meta.error.stack) {
//       logger.log({ level: 'error', message: meta.error.stack, ...meta, stack: true });
//     }
//   }

//   if (action === 'response') {
//     respondToClient(meta.res, meta.status, message, meta.data || {});
//   } else if (action === 'log') {
//     specializedLoggers.console.log({ level, message, ...meta });
//   } else if (action === 'file') {
//     specializedLoggers.file.log({ level, message, ...meta });
//   }

//   if (meta?.section === 'cronjob') {
//     const coloredLevel = colorizeMessage(level, level.toUpperCase());
//     const coloredMessage = colorizeMessage(level, message);
//     let formattedMessage = `[${timestamp}] ${coloredLevel}: ${coloredMessage}`;
//     if (meta) {
//       formattedMessage += ` | Section: ${meta.section}`;
//       if (meta.data) {
//         const dataString = JSON.stringify(meta.data);
//         formattedMessage += ` | Data: {${dataString}}`;
//       }
//     }

//     specializedLoggers.cronjob.log({ level, message: formattedMessage, ...meta });
//   }
// }

// function respondToClient(res, status, message, data = {}) {
//   if (res.headersSent) return;
//   res.status(status).json({ message, data });
// }

// const priceLogger = createLoggerWithTransports(
//   'price',
//   process.env['PRICE_LOG_LEVEL'] || defaultLogLevel,
// );

// // Function to log price changes using a table format
// // const logPriceChanges = (data) => {
// //   if (!data || typeof data !== 'object') {
// //     priceLogger.warn('Invalid data provided for logging price changes.');
// //     return;
// //   }

// //   priceLogger.info('Price Changes:');
// //   priceLogger.info(
// //     '+--------------------------------------+-------------------+-------------------+',
// //   );
// //   priceLogger.info(
// //     '| Card Name                            | Previous Price    | Updated Price     |',
// //   );
// //   priceLogger.info(
// //     '+--------------------------------------+-------------------+-------------------+',
// //   );

// //   Object.entries(data).forEach(([key, card]) => {
// //     const previousPrice = card.previousPrice.toFixed(2);
// //     const updatedPrice = card.updatedPrice.toFixed(2);

// //     priceLogger.info(
// //       `| ${card.name.padEnd(36)} | $${previousPrice.padStart(17)} | $${updatedPrice.padStart(
// //         17,
// //       )} |`,
// //     );
// //   });

// //   priceLogger.info(
// //     '+--------------------------------------+-------------------+-------------------+',
// //   );
// // };

// module.exports = {
//   loggers: specializedLoggers,
//   logger: specializedLoggers.general,
//   directResponse,
//   directError,
//   logToAllSpecializedLoggers,
//   respondToClient,
//   colorizeKey,
//   fileTransport,
//   createTransports,
//   createLoggerWithTransports,
//   initSpecializedLoggers,
//   logSelectedList,
//   priceLogger,
//   logPriceChanges,
// };
