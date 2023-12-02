const fs = require('fs');
const { processCollection } = require('./collectionLogTracking');
const { processCard } = require('./logPriceChanges');
const { LOG_TYPES, ERROR_TYPES } = require('../constants');
require('colors');

// Directory for logs
const logsDir = './logs';

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

function determineLogType(data) {
  if (Array.isArray(data)) {
    if (data.length > 0) {
      // eslint-disable-next-line no-prototype-builtins
      if (data[0].hasOwnProperty('cards')) {
        return LOG_TYPES.COLLECTIONS;
      }
      return LOG_TYPES.CARDS;
    }
  } else if (typeof data === 'object' && data !== null) {
    // eslint-disable-next-line no-prototype-builtins
    if (data.hasOwnProperty('cards')) {
      return LOG_TYPES.COLLECTION;
    }
    return LOG_TYPES.CARD;
  }
  return LOG_TYPES.OTHER;
}

function logData(data) {
  const logType = determineLogType(data);
  let logContent = '';

  switch (logType) {
    case LOG_TYPES.CARD:
      logContent = logSingleCard(data);
      break;
    case LOG_TYPES.CARDS:
      logContent = logMultipleCards(data);
      break;
    case LOG_TYPES.COLLECTION:
      logContent = logSingleCollection(data);
      break;
    case LOG_TYPES.COLLECTIONS:
      logContent = logMultipleCollections(data);
      break;
    case LOG_TYPES.OTHER:
    default:
      logContent = logOtherData(data);
      break;
  }

  fs.appendFileSync(`${logsDir}/${logType}-data.log`, logContent, (err) => {
    if (err) console.error('Error writing to log file'.red);
  });
}

// Log Single Card
function logSingleCard(card) {
  if (!card) {
    console.error('No card data provided.'.red);
    return '';
  }

  let logContent = '----- Single Card Log -----\n\n';
  logContent += processCard(card);

  // logContent += formatCardDetails(card);
  logContent += '----- End of Single Card Log -----\n\n';
  return logContent;
}

// Log Multiple Cards
function logMultipleCards(cards) {
  if (!Array.isArray(cards)) {
    console.error('Data must be an array of cards.'.red);
    return '';
  }

  let logContent = '----- Multiple Cards Log -----\n\n';
  cards.forEach((card, index) => {
    logContent += `[Card ${index + 1}]\n`;
    logContent += processCard(card);
    // logContent += formatCardDetails(card);
  });
  logContent += '----- End of Multiple Cards Log -----\n\n';
  return logContent;
}

// Log Single Collection
function logSingleCollection(collection) {
  if (!collection) {
    console.error('No collection data provided.'.red);
    return '';
  }

  let logContent = '----- Single Collection Log -----\n\n';
  logContent += processCollection(collection);
  logContent += '----- End of Single Collection Log -----\n\n';
  return logContent;
}

// Log Multiple Collections
function logMultipleCollections(collections) {
  if (!Array.isArray(collections)) {
    console.error('Data must be an array of collections.'.red);
    return '';
  }

  let logContent = '----- Multiple Collections Log -----\n\n';
  collections.forEach((collection, index) => {
    logContent += `[Collection ${index + 1}]\n`;
    logContent += processCollection(collection);
  });
  logContent += '----- End of Multiple Collections Log -----\n\n';
  return logContent;
}

// Log Other Data
function logOtherData(data) {
  let logContent = '----- Other Data Log -----\n\n';
  if (typeof data === 'object' && data !== null) {
    logContent += JSON.stringify(data, null, 2);
  }
  if (typeof data === 'string') {
    logContent += data;
  }
  if (typeof data === 'number') {
    logContent += data.toString();
  }
  if (typeof data === 'boolean') {
    logContent += data.toString();
  }
  if (typeof data === 'undefined' && data?.data !== undefined) {
    logContent += `!!! [DATA MUST BE ACCESSED FIRST][${typeof data}] !!!`.red;
    logContent += JSON.stringify(data?.data, null, 2);
  }
  if (typeof data === 'undefined' && data?.data === undefined) {
    logContent += '!!! [UNDEFINED] !!!';
    logContent += JSON.stringify(data, null, 2);
  }
  // logContent += JSON.stringify(data, null, 2);
  logContent += '\n----- End of Other Data Log -----\n\n';
  return logContent;
}

function logError(error, errorType, problematicValue, additionalInfo = {}) {
  let errorContent = `|----- Error Log -----\n\n[ERROR] ${new Date().toISOString()}\n`;
  let errorMessage = '';

  switch (errorType) {
    case 'SERVER_ERROR':
      errorMessage = ERROR_TYPES.SERVER_ERROR(error);
      break;
    case 'VALIDATION_ERROR':
      errorMessage = ERROR_TYPES.VALIDATION_ERROR;
      break;
    case 'NOT_FOUND':
      errorMessage = ERROR_TYPES.NOT_FOUND(problematicValue);
      break;
    case 'DUPLICATE_KEY_ERROR':
      errorMessage = ERROR_TYPES.DUPLICATE_KEY_ERROR;
      break;
    case 'INTERNAL_SERVER_ERROR':
      errorMessage = ERROR_TYPES.INTERNAL_SERVER_ERROR;
      break;
    case 'REQUIRED_FIELDS_MISSING':
      errorMessage = ERROR_TYPES.REQUIRED_FIELDS_MISSING;
      break;
    case 'INVALID_USER_DATA':
      errorMessage = ERROR_TYPES.INVALID_USER_DATA;
      break;
    case 'INVALID_COLLECTION_NAME':
      errorMessage = ERROR_TYPES.INVALID_COLLECTION_NAME;
      break;
    case 'NON_ARRAY_DATA':
      errorMessage = ERROR_TYPES.NON_ARRAY_DATA;
      break;

    // Add more cases as needed
    default:
      errorMessage = ERROR_TYPES.INTERNAL_SERVER_ERROR;
      break;
  }

  if (problematicValue) {
    errorContent += `| [Problematic Value]: ${JSON.stringify(problematicValue, null, 2)}\n`;
  }

  const errorLog = {
    timestamp: new Date().toISOString(),
    functionName: additionalInfo.functionName || 'Unknown',
    requestInfo: additionalInfo.request || 'N/A',
    errorMessage: error.message,
    errorStack: error.stack,
    errorType: error.constructor.name,
    environment: {
      nodeVersion: process.version,
      // Add other environment details
    },
    user: additionalInfo.user || 'Unknown',
    debugInfo: additionalInfo.debug || {},
  };
  errorContent += `| [Message]: ${errorMessage.message ? errorMessage.message : errorMessage}\n`;
  errorContent += `| [Timestamp]:\n${errorLog.timestamp}\n`;
  errorContent += `| [Function Name]:\n${errorLog.functionName}\n`;
  errorContent += `| [Request Info]:\n${errorLog.requestInfo}\n`;
  errorContent += `| [User]:\n${errorLog.user}\n`;
  errorContent += `| [Data]:\n${
    errorLog.debugInfo.data ? JSON.stringify(errorLog.debugInfo.data, null, 2) : 'N/A'
  }\n`;
  errorContent += `| [Debug Info]:\n${JSON.stringify(errorLog.debugInfo, null, 2)}\n`;
  errorContent += `| [Environment]:\n${JSON.stringify(errorLog.environment, null, 2)}\n`;
  errorContent += `| [Stack]:\n${error.stack}\n`;
  errorContent += `| [Error]:\n${error}\n`;
  errorContent += `| [Error Type]:\n${errorType}\n`;
  errorContent += `| [Error Message]:\n${errorMessage}\n`;
  errorMessage += '';
  errorContent += '|_____ End of Error Log _____\n\n';
  console.error(errorContent.red);

  fs.appendFileSync(`${logsDir}/error.log`, errorContent.replace(/\[\d+m/g, ''), (err) => {
    if (err) console.error('Error writing to error log file'.red);
  });
}
module.exports = {
  logData,
  logError,
};
