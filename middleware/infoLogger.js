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

const winston = require('winston');
require('winston-daily-rotate-file');
const { createLogger, format, transports } = winston;

const logLevel = process.env.LOG_LEVEL || 'debug';
const env = process.env.NODE_ENV;

// Colorized format for console logs
const colorizedFormat = format.printf(({ level, message, timestamp, meta }) => {
  let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  if (meta && meta.section) {
    const colorMap = {
      id: '\x1b[36m', // Cyan
      price: '\x1b[33m', // Yellow
      chart_datasets: '\x1b[32m', // Green
    };
    formattedMessage = `${colorMap[meta.section] || ''}${formattedMessage}\x1b[0m`;
  }
  return formattedMessage;
});

// Combined format for both console and file logging, including both colorized and JSON formats
const logFormat = format.combine(
  format.timestamp(),
  format.json(),
  format.colorize(),
  colorizedFormat,
);
// Create a transport for rotating files
const fileTransport = (label) =>
  new transports.DailyRotateFile({
    filename: `${label}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
  });

// Function to create a list of transports, including console transport
const transportList = (label) => {
  return [fileTransport(label), new transports.Console({ format: logFormat })];
};

// Factory function to create loggers with the appropriate transports
const createLoggerWithTransports = (label) =>
  createLogger({
    level: logLevel,
    transports: transportList(label),
  });

const specializedLoggers = {
  collection: createLoggerWithTransports('collections'),
  cardPrice: createLoggerWithTransports('cardPrices'),
  cronJob: createLoggerWithTransports('cronJobs'),
  error: createLoggerWithTransports('errors'),
  response: createLoggerWithTransports('responses'),
};

function logToAllSpecializedLoggers(message, meta) {
  for (const [key, logger] of Object.entries(specializedLoggers)) {
    if (meta && meta.section && meta.section === key) {
      logger.log({ level: logLevel, message, meta }); // Ensure that metadata is passed correctly
    } else if (!meta || !meta.section) {
      logger.log({ level: logLevel, message }); // Log the message without metadata if it's not specified
    }
  }
}

// Export the loggers
module.exports = {
  logger: createLoggerWithTransports('application'),
  ...specializedLoggers,
  logToAllSpecializedLoggers,
};
