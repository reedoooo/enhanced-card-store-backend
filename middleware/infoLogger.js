const winston = require('winston');
require('winston-daily-rotate-file');
const { createLogger, format, transports } = winston;
// const { combine, timestamp, printf, colorize } = format;

const defaultLogLevel = 'error';

// ANSI color codes for console output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  purple: '\x1b[35m',
  orange: '\x1b[38;5;208m',
  // Add other custom colors here
  reset: '\x1b[0m',
};

// Log level colors
const levelColors = {
  error: colors.red,
  warn: colors.yellow,
  info: colors.green,
  debug: colors.blue,
  collection: colors.blue,
  cardPrice: colors.yellow,
  cronJob: colors.green,
  response: colors.green,
  general: colors.purple,
  // Add other custom log levels here
};

const shouldColorKey = (key) => {
  const keysToColor = [
    // List of keys to apply blue color
    'chartData',
    'datasets',
    'xys',
    'allXYValues',
    '_id',
    'userId',
    'name',
    'description',
    'totalCost',
    'totalPrice',
    'quantity',
    'totalQuantity',
    'allCardPrices',
    'cards',
    'currentChartDatasets',
    '__v',
  ];
  return keysToColor.includes(key);
};

const consoleFormat = format.printf(({ level, message, timestamp, meta }) => {
  const levelColor = levelColors[level] || colors.reset;
  let formattedMessage = `[${timestamp}] ${levelColor}${level}${colors.reset}: `;

  // Check if message is an object and convert to string using JSON.stringify
  if (typeof message === 'object') {
    formattedMessage += JSON.stringify(message, null, 2);
  } else {
    formattedMessage += message;
  }

  if (meta && meta.section) {
    // const sectionColor = shouldColorKey('section') ? colors.blue : '';
    // formattedMessage += ` | Section: ${sectionColor}${meta.section}${colors.reset}`;
    formattedMessage += ` | Section: ${meta.section}`;

    if (meta.data) {
      const dataToFormat = meta.data._doc ? meta.data._doc : meta.data;
      const coloredData = Object.entries(dataToFormat)
        .map(([key, value]) => {
          const coloredKey = shouldColorKey(key) ? `${colors.blue}${key}${colors.reset}` : key;
          const stringValue =
            typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
          return `${coloredKey}: ${stringValue}`;
        })
        .join(', ');
      formattedMessage += ` | Data: [${typeof coloredData}] --> {${coloredData}}`;
    }
  }

  return formattedMessage;
});

const fileTransport = (label) =>
  new transports.DailyRotateFile({
    filename: `${label}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: format.combine(format.timestamp(), format.json()), // No color in file
  });

const createTransports = (label, level) => [
  // Create transports for both console and file
  new transports.Console({
    level,
    // format: format.combine(format.timestamp(), consoleFormat),
    format: format.combine(format.timestamp(), format.colorize({ all: true }), consoleFormat),
  }),
  fileTransport(label),
];

const createLoggerWithTransports = (label, level = defaultLogLevel) =>
  createLogger({
    level: level,
    transports: createTransports(label, level),
  });

const specializedLoggers = {
  collection: createLoggerWithTransports(
    'collections',
    process.env.COLLECTION_LOG_LEVEL || defaultLogLevel,
  ),
  cardPrice: createLoggerWithTransports(
    'cardPrices',
    process.env.CARD_PRICE_LOG_LEVEL || defaultLogLevel,
  ),
  cronJob: createLoggerWithTransports(
    'cronJobs',
    process.env.CRON_JOB_LOG_LEVEL || defaultLogLevel,
  ),
  error: createLoggerWithTransports('errors', process.env.ERROR_LOG_LEVEL || defaultLogLevel),
  response: createLoggerWithTransports(
    'responses',
    process.env.RESPONSE_LOG_LEVEL || defaultLogLevel,
  ),
  decks: createLoggerWithTransports('decks', process.env.DECK_LOG_LEVEL || defaultLogLevel), // New 'decks' logger
};

function logToConsole(level, message, meta) {
  // Fixed by initializing a default console logger if not present
  const consoleLogger = specializedLoggers.console || createLoggerWithTransports('console');
  consoleLogger.log({ level, message, ...meta });
}

function logToFile(label, level, message, meta) {
  const logger = specializedLoggers[label] || createLoggerWithTransports(label);
  logger.log({ level, message, ...meta });
}
// Function to respond to the client
function respondToClient(res, status, message, data = {}) {
  res.status(status).json({ status, message, data });
}

// Function to log messages with appropriate metadata
// function logToAllSpecializedLoggers(level, message, meta, action) {
//   // Ensure the provided level is a known level or fallback to default log level
//   // level = levelColors[level] ? level : defaultLogLevel;
//   level = levelColors.level ? level : defaultLogLevel;

//   const logger = specializedLoggers[meta?.section] || createLoggerWithTransports(meta?.section);
//   logger.log({ level, message, ...meta });
//   if (meta?.error instanceof Error) {
//     logger.log({
//       level: 'error',
//       message: meta.error.message,
//       meta,
//     });

//     // If an error stack is present, log it separately at the 'error' level as well
//     if (meta.error.stack) {
//       logger.log({
//         level: 'error',
//         message: meta.error.stack,
//         meta: { ...meta, stack: true }, // Indicate that this log is for the stack trace
//       });
//     }
//   } else {
//     // Log the message using the level provided to the function
//     logger.log({
//       level,
//       message,
//       meta,
//     });
//   }
//   // Take appropriate action based on 'action' argument
//   if (action === 'response') {
//     respondToClient(meta.res, meta.status, message, meta.data || {});
//   } else if (action === 'log') {
//     logToConsole(level, message, meta);
//   } else if (action === 'file') {
//     logToFile(meta.section, level, message, meta);
//   }
// }
function logToAllSpecializedLoggers(level, message, meta, action) {
  // level = levelColors.level ? level : defaultLogLevel;
  const logLevel = levelColors[level] ? level : defaultLogLevel;
  const logger =
    specializedLoggers[meta?.section] || createLoggerWithTransports(meta?.section, logLevel);

  // Prepare the metadata for logging
  const logMeta = {
    level: logLevel,
    message,
    meta: { ...meta, level: logLevel }, // include the level color in the meta
  };

  // Log the message and metadata
  logger.log(logMeta);

  // Log the error details separately if an error object is included
  if (meta?.error instanceof Error) {
    logger.log({
      level: 'error',
      message: meta.error.message,
      meta,
    });

    // Log the stack trace separately
    if (meta.error.stack) {
      logger.log({
        level: 'error',
        message: meta.error.stack,
        meta: { ...meta, stack: true },
      });
    }
  }

  // Execute the action based on the 'action' argument
  if (action === 'response') {
    respondToClient(meta.res, meta.status, message, meta.data || {});
  } else if (action === 'log') {
    logToConsole(logLevel, message, meta);
  } else if (action === 'file') {
    logToFile(meta.section, logLevel, message, meta);
  }
}
// Export the main application logger and specialized loggers
module.exports = {
  logger: createLoggerWithTransports('application'),
  ...specializedLoggers,
  logToAllSpecializedLoggers,
  logToConsole,
  logToFile,
  respondToClient,
};

// const winston = require('winston');
// require('winston-daily-rotate-file');

// const logLevel = process.env.LOG_LEVEL || 'debug';

// const { createLogger, format, transports } = winston;
// const { combine, timestamp, printf, colorize } = format;

// // Timestamp format
// const timestampFormat = format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });

// // Colorized format for console logs
// const colorizedFormat = printf(({ level, message, timestamp, meta }) => {
//   let colorizedMessage = message;
//   if (meta && meta.section) {
//     const colorMap = {
//       id: '\x1b[36m', // Cyan for 'id'
//       price: '\x1b[33m', // Yellow for 'price'
//       chart_datasets: '\x1b[32m', // Green for 'chart_datasets'
//     };
//     const color = colorMap[meta.section] || '';
//     colorizedMessage = `${color}${message}\x1b[0m`;
//   }
//   return `[${timestamp}] ${level.toUpperCase()}: ${colorizedMessage}`;
// });

// // Add colorize to the console transport if you want to use winston's colorize feature instead
// const customColorize = colorize({
//   all: false,
//   colors: { id: 'cyan', price: 'yellow', chart_datasets: 'green' },
// });
// // Define a format for both file and console logs, which includes colorization
// const logFormat = printf(({ level, message, timestamp, meta }) => {
//   const baseMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
//   if (!meta) return baseMessage;

//   const metaString = JSON.stringify(meta, null, 2);
//   let colorizedMessage = baseMessage;

//   // Define color mapping for console output
//   if (meta.section) {
//     const colorMap = {
//       id: '\x1b[36m', // Cyan for 'id'
//       price: '\x1b[33m', // Yellow for 'price'
//       chart_datasets: '\x1b[32m', // Green for 'chart_datasets'
//     };
//     const color = colorMap[meta.section] || '';
//     colorizedMessage = `${color}${baseMessage}\x1b[0m`;
//   }

//   return process.env.NODE_ENV !== 'production' ? colorizedMessage : `${baseMessage} ${metaString}`;
// });
// // const consoleFormat = format.combine(
// //   format.colorize(),
// //   timestampFormat,
// //   format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
// // );

// const dailyRotateFileOptions = {
//   datePattern: 'YYYY-MM-DD',
//   zippedArchive: true,
//   maxSize: '20m',
//   maxFiles: '14d',
// };
// const dailyRotateFileTransport = (fileLabel) =>
//   new transports.DailyRotateFile({
//     filename: `${fileLabel}-%DATE%.log`,
//     datePattern: 'YYYY-MM-DD',
//     zippedArchive: true,
//     maxSize: '20m',
//     maxFiles: '14d',
//     format: combine(timestampFormat, format.json()),
//   });

// const customLogFormat = printf(({ timestamp, level, message, meta }) => {
//   let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
//   if (meta) {
//     output += ` ${JSON.stringify(meta, null, 2)}`;
//   }
//   return output;
// });

// // Define a format for console output
// const consoleFormat = combine(timestampFormat, colorize(), colorizedFormat);

// // Transport initialization with conditional console log
// const initializeTransports = (fileLabel) => {
//   const transportList = [dailyRotateFileTransport(fileLabel)];
//   if (process.env.NODE_ENV !== 'production') {
//     transportList.push(new transports.Console({ format: consoleFormat }));
//   }
//   return transportList;
// };

// // Initialize transports with file rotation and conditional console log
// // const initializeTransports = (fileLabel) => {
// //   const transports = [
// //     new winston.transports.DailyRotateFile({
// //       filename: `${fileLabel}-%DATE%.log`,
// //       ...dailyRotateFileOptions,
// //       format: combine(timestampFormat, customLogFormat),
// //     }),
// //   ];

// //   if (process.env.NODE_ENV !== 'production') {
// //     transports.push(
// //       new winston.transports.Console({
// //         format: consoleFormat,
// //       }),
// //     );
// //   }

// //   return transports;
// // };

// // Create logger with integrated transport initialization
// // const createLoggerWithTransports = (fileLabel, level = 'info') => {
// //   const transports = initializeTransports(fileLabel);
// //   const logger = winston.createLogger({
// //     level,
// //     format: combine(timestampFormat, format.json()),
// //     transports,
// //   });

// //   return {
// //     logger,
// //     info: (message, meta) => logger.info(message, { meta }),
// //     warn: (message, meta) => logger.warn(message, { meta }),
// //     error: (message, meta) => logger.error(message, { meta }),
// //     // Other logging levels can be added as needed
// //   };
// // };
// // Define the log level for the logger based on environment or default
// const createLoggerWithTransports = (fileLabel, level = logLevel) => {
//   return createLogger({
//     level,
//     format: combine(timestampFormat, format.json()),
//     transports: initializeTransports(fileLabel),
//   });
// };

// // const logger = createLoggerWithTransports('application');
// const specializedLoggers = {
//   collection: createLoggerWithTransports('collections'),
//   cardPrice: createLoggerWithTransports('cardPrices'),
//   cronJob: createLoggerWithTransports('cronJobs'),
//   error: createLoggerWithTransports('errors'),
//   response: createLoggerWithTransports('responses'),
// };
// // Define loggers for different purposes
// // const logger = createLoggerWithTransports('application', logLevel);
// // const collectionLogger = createLoggerWithTransports('collections', logLevel);
// // const cardPriceLogger = createLoggerWithTransports('cardPrices', logLevel);
// // const cronJobLogger = createLoggerWithTransports('cronJobs', logLevel);
// // const errorLogger = createLoggerWithTransports('errors', logLevel);
// // const responseLogger = createLoggerWithTransports('responses', logLevel);

// // Example usage of specialized logging function
// // Example usage of specialized logging function
// function logChartDataDetails(label, data) {
//   specializedLoggers.cardPrice.info(`[CHART DATA] ${label}: ${JSON.stringify(data)}`, {
//     section: 'chart_datasets',
//   });
// }

// module.exports = {
//   logger: createLoggerWithTransports('application'),
//   ...specializedLoggers,
//   logChartDataDetails,
//   responseLogger: specializedLoggers.response,
//   // cardPriceLogger: specializedLoggers.cardPrice,
//   // cronJobLogger: specializedLoggers.cronJob,
//   // errorLogger: specializedLoggers.error,
//   // logChartDataDetails,
//   // collectionLogger: specializedLoggers.collection,
//   // responseLogger: specializedLoggers.response,
// };

// Function to color specific keys
// function colorizeKeys(obj) {
//   const keysToColor = [
//     'chartData',
//     'datasets',
//     'xys',
//     'allXYValues',
//     '_id',
//     'userId',
//     'name',
//     'description',
//     'totalCost',
//     'totalPrice',
//     'quantity',
//     'totalQuantity',
//     'allCardPrices',
//     'cards',
//     'xys',
//     'currentChartDatasets',
//     '__v',
//   ]; // Keys to color blue
//   return Object.entries(obj)
//     .map(([key, value]) => {
//       // Color the key if it's in the list of keys to color
//       const coloredKey = keysToColor.includes(key) ? `${blue}${key}${reset}` : key;
//       // Convert value to string for logging
//       const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
//       return `${coloredKey}: ${stringValue}`;
//     })
//     .join(', ');
// }
// Predicate function to determine if a key should be colored

// Colorized format for console logs
// const colorizedFormat = format.printf(({ level, message, timestamp, meta }) => {
//   let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

//   if (meta && meta.section) {
//     const colorMap = {
//       id: '\x1b[36m', // Cyan
//       price: '\x1b[33m', // Yellow
//       chart_datasets: '\x1b[32m', // Green
//     };
//     formattedMessage = `${colorMap[meta.section] || ''}${formattedMessage}${reset}`;

//     // Add logging for meta.data if it exists
//     if (meta.data) {
//       const coloredData = Object.entries(meta.data)
//         .map(([key, value]) => {
//           return `${blue}${key}${reset}:${JSON.stringify(value)}`;
//         })
//         .join(', ');
//       formattedMessage += ` | Data: {${coloredData}}`;
//     }
//   }

//   return formattedMessage;
// });
// const winston = require('winston');
// require('winston-daily-rotate-file');
// const { createLogger, format, transports } = winston;

// // Set default log level from environment variable or fall back to 'debug'
// // const logLevel = process.env.LOG_LEVEL || 'error';
// const defaultLogLevel = 'error';

// // ANSI color codes for console output
// const colors = {
//   blue: '\x1b[34m',
//   green: '\x1b[32m',
//   yellow: '\x1b[33m',
//   red: '\x1b[31m',
//   reset: '\x1b[0m',
// };

// // Log level colors
// const levelColors = {
//   error: colors.red,
//   warn: colors.yellow,
//   info: colors.green,
//   debug: colors.blue,

//   // Add custom log levels here
//   collection: colors.blue,
//   cardPrice: colors.yellow,
//   cronJob: colors.green,
//   response: colors.green,
// };

// // Function to determine if a key should be colorized
// const shouldColorKey = (key) => {
//   const keysToColor = [
//     // List of keys to apply blue color
//     'chartData',
//     'datasets',
//     'xys',
//     'allXYValues',
//     '_id',
//     'userId',
//     'name',
//     'description',
//     'totalCost',
//     'totalPrice',
//     'quantity',
//     'totalQuantity',
//     'allCardPrices',
//     'cards',
//     'currentChartDatasets',
//     '__v',
//   ];
//   return keysToColor.includes(key);
// };

// // Custom format for console logs with color
// const consoleFormat = format.printf(({ level, message, timestamp, meta }) => {
//   const levelColor = levelColors[level] || colors.reset;
//   let formattedMessage = `[${timestamp}] ${levelColor}${level}${colors.reset}: ${message}`;

//   if (meta && meta.section) {
//     const sectionColor = shouldColorKey('section') ? colors.blue : '';
//     formattedMessage += ` | Section: ${sectionColor}${meta.section}${colors.reset}`;

//     if (meta.data) {
//       const dataToFormat = meta.data._doc ? meta.data._doc : meta.data;
//       const coloredData = Object.entries(dataToFormat)
//         .map(([key, value]) => {
//           const coloredKey = shouldColorKey(key) ? `${colors.blue}${key}${colors.reset}` : key;
//           const stringValue =
//             typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
//           return `${coloredKey}: ${stringValue}`;
//         })
//         .join(', ');
//       formattedMessage += ` | Data: {${coloredData}}`;
//     }
//   }

//   return formattedMessage;
// });

// // Create a rotating file transport with a daily rotation
// const fileTransport = (label) =>
//   new transports.DailyRotateFile({
//     filename: `${label}-%DATE%.log`,
//     datePattern: 'YYYY-MM-DD',
//     zippedArchive: true,
//     maxSize: '20m',
//     maxFiles: '14d',
//     format: format.combine(format.timestamp(), format.json()), // No color in file
//   });

// // Function to create an array of transports for different logging outputs
// const transportList = (label, level) => [
//   new transports.Console({
//     level: level,
//     format: format.combine(format.timestamp(), format.colorize({ all: true }), consoleFormat),
//   }),
//   fileTransport(label),
// ];
// // Factory function to create loggers with the appropriate transports
// const createLoggerWithTransports = (label, level = defaultLogLevel) =>
//   createLogger({
//     level: level,
//     transports: transportList(label, level),
//   });
// // Create specialized loggers for different parts of the application
// const specializedLoggers = {
//   collection: createLoggerWithTransports(
//     'collections',
//     process.env.COLLECTION_LOG_LEVEL || defaultLogLevel,
//   ),
//   cardPrice: createLoggerWithTransports(
//     'cardPrices',
//     process.env.CARD_PRICE_LOG_LEVEL || defaultLogLevel,
//   ),
//   cronJob: createLoggerWithTransports(
//     'cronJobs',
//     process.env.CRON_JOB_LOG_LEVEL || defaultLogLevel,
//   ),
//   error: createLoggerWithTransports('errors', process.env.ERROR_LOG_LEVEL || defaultLogLevel),
//   response: createLoggerWithTransports(
//     'responses',
//     process.env.RESPONSE_LOG_LEVEL || defaultLogLevel,
//   ),
//   decks: createLoggerWithTransports('decks', process.env.DECK_LOG_LEVEL || defaultLogLevel), // New 'decks' logger
// };

// // Function to log messages with appropriate metadata
// // function logToAllSpecializedLoggers(message, meta) {
// //   const logger = specializedLoggers[meta?.section];
// //   if (logger) {
// //     logger.log({
// //       level: logLevel,
// //       message,
// //       meta,
// //     });
// //   }
// // }
// // Function to log messages with appropriate metadata
// // Creates a logger instance for console logging
// const consoleLogger = createLoggerWithTransports('console');

// // Function to log to the console with color formatting
// function logToConsole(level, message, meta) {
//   const consoleMeta = meta ? { ...meta, message } : { message };
//   consoleLogger.log({ level, message: consoleMeta });
// }

// // Function to log to file without color
// function logToFile(label, level, message, meta) {
//   const fileLogger = specializedLoggers[label];
//   if (fileLogger) {
//     fileLogger.log({ level, message, meta });
//   }
// }

// // Function to respond to the client
// function respondToClient(res, status, message, data = {}) {
//   const response = {
//     status,
//     message,
//     data,
//   };
//   res.status(status).json(response);
// }

// function logToAllSpecializedLoggers(level, message, meta, action) {
//   // Ensure the provided level is a known level or fallback to default log level
//   level = levelColors[level] ? level : defaultLogLevel;

//   const logger = specializedLoggers[meta?.section];
//   if (logger) {
//     // Log the message with the level provided to the function
//     logger.log({
//       level,
//       message,
//       meta,
//     });

//     // Respond to the client if the action is 'response'
//     if (action === 'response') {
//       respondToClient(meta.res, meta.status, message, meta.data || {});
//     }
//   }

//   // Log to console with color formatting if the action is 'log'
//   if (action === 'log') {
//     logToConsole(level, message, meta);
//   }

//   // Log to file without color if the action is 'file'
//   if (action === 'file') {
//     logToFile(meta.section, level, message, meta);
//   }
// }
// // if (logger) {
// //   // If an error is present, log it at the 'error' level regardless of the passed level
//   if (meta?.error instanceof Error) {
//     logger.log({
//       level: 'error',
//       message: meta.error.message,
//       meta,
//     });

//     // If an error stack is present, log it separately at the 'error' level as well
//     if (meta.error.stack) {
//       logger.log({
//         level: 'error',
//         message: meta.error.stack,
//         meta: { ...meta, stack: true }, // Indicate that this log is for the stack trace
//       });
//     }
//   } else {
//     // Log the message using the level provided to the function
//     logger.log({
//       level,
//       message,
//       meta,
//     });
//   }
// // }

// // Export the main application logger and specialized loggers
// module.exports = {
//   logger: createLoggerWithTransports('application'),
//   ...specializedLoggers,
//   logToAllSpecializedLoggers,
//   logToConsole,
//   logToFile,
//   respondToClient,
// };
