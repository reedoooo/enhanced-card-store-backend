const fs = require('fs');
const path = require('path');
const { LOG_TYPES, ERROR_TYPES } = require('../constants');
const { logger } = require('../middleware/infoLogger');
const { formatDateTime } = require('./utils');
require('colors');

// Directory for logs
const logsDir = path.join(__dirname, './logs');

// Ensure logs directory exists
async function ensureLogDirectory() {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (err) {
    console.error('Error ensuring log directory exists:'.red, err);
  }
}
ensureLogDirectory();

// determineLogType - Determines the type of data being logged
function determineLogType(data, data2) {
  // console.log('Determining log type...'.blue);
  // if logData looks like this: loadData('update', update)
  if (typeof data === 'string') {
    return LOG_TYPES.GENERAL;
  } else if (typeof data === 'number') {
    return LOG_TYPES.GENERAL;
  }
  if (Array.isArray(data)) {
    return data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'cards')
      ? LOG_TYPES.CARDS
      : LOG_TYPES.COLLECTIONS;
  } else if (data && typeof data === 'object') {
    return Object.prototype.hasOwnProperty.call(data, 'priceHistory')
      ? LOG_TYPES.CARD
      : LOG_TYPES.COLLECTION;
  }
  return LOG_TYPES.OTHER;
}

// getLogFileName - Returns the name of the log file
function getLogFileName(logType) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${logType}-${date}.log`;
}
// safeAppendFile - Appends content to a file, creating the file if it does not exist
function safeAppendFile(filePath, content) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, ''); // Create file if it does not exist
    }
    fs.appendFileSync(filePath, content);
  } catch (err) {
    console.error(`Error writing to file ${filePath}`.red, err);
  }
}

const processCard = (data) => {
  let logContent = '';
  try {
    const cards = Array.isArray(data) ? data : [data];

    cards.forEach((card, index) => {
      const latestPrice = parseFloat(card?.latestPrice?.num ?? 0);
      const lastSavedPrice = parseFloat(card?.lastSavedPrice?.num ?? 0);
      const priceChange = latestPrice - lastSavedPrice;
      const percentageChange = (priceChange / lastSavedPrice) * 100;
      const statusColor = priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'grey';
      const status = priceChange > 0 ? 'increased' : priceChange < 0 ? 'decreased' : 'unchanged';

      console.log(`[${index}] [CARD NAME] ${card?.name}`[statusColor]);
      logContent += `[${index}] [CARD NAME] ${card?.name}\n`;
      console.log(`    [CURRENT PRICE] $${latestPrice.toFixed(2)}`);
      logContent += `    [CURRENT PRICE] $${latestPrice.toFixed(2)}\n`;
      console.log(`    [PREVIOUS PRICE] $${lastSavedPrice.toFixed(2)}`);
      logContent += `    [PREVIOUS PRICE] $${lastSavedPrice.toFixed(2)}\n`;
      console.log(`    [UPDATED PRICE]  $${latestPrice.toFixed(2)}`);
      logContent += `    [UPDATED PRICE]  $${latestPrice.toFixed(2)}\n`;
      console.log(`    [QUANTITY]         ${card?.quantity} (${status})`);
      logContent += `    [QUANTITY]         ${card?.quantity} (${status})\n`;
      console.log(`    [CHANGE]         ${priceChange.toFixed(2)} (${status})`);
      logContent += `    [CHANGE]         ${priceChange.toFixed(2)} (${status})\n`;
      console.log(`    [PERCENTAGE]     ${percentageChange.toFixed(2)}% (${status})`);
      logContent += `    [PERCENTAGE]     ${percentageChange.toFixed(2)}% (${status})\n`;
      console.log(`    [STATUS]         ${status}\n`);
      logContent += `    [STATUS]         ${status}\n\n`;
    });
  } catch (error) {
    console.error('Error processing card:', error);
    logError(error, error.message, null, {
      source: 'processCard',
      debugInfo: {
        data: data,
      },
    });
    logContent += `Error processing card: ${error.message}\n`;
  }
  return logContent;
};

const processCollection = (data) => {
  let logContent = '';
  try {
    const collections = Array.isArray(data) ? data : [data];

    collections.forEach((collection, index) => {
      console.log(`[COLLECTION ${index + 1}] ${collection.name}`.blue);
      logContent += `[COLLECTION ${index + 1}] ${collection.name}\n`;
      console.log(`[DESCRIPTION] ${collection.description}`);
      logContent += `[DESCRIPTION] ${collection.description}\n`;
      console.log(`[TOTAL PRICE] $${collection.totalPrice}`);
      logContent += `[TOTAL PRICE] $${collection.totalPrice}\n`;
      console.log(`[QUANTITY] ${collection.quantity}`);
      logContent += `[QUANTITY] ${collection.quantity}\n`;
      console.log(`[TOTAL QUANTITY] ${collection.totalQuantity}`);
      logContent += `[TOTAL QUANTITY] ${collection.totalQuantity}\n`;

      console.log('[CARDS IN COLLECTION]'.magenta);
      logContent += '[CARDS IN COLLECTION]\n';

      let cardsChanged = false;
      collection?.cards?.forEach((card, cardIndex) => {
        try {
          const latestPrice = parseFloat(card?.latestPrice?.num ?? 0)?.toFixed(2);
          const lastSavedPrice = parseFloat(card?.lastSavedPrice?.num ?? 0)?.toFixed(2);
          if (latestPrice !== lastSavedPrice) {
            logContent += processCard(card);
            cardsChanged = true;
          }
        } catch (cardError) {
          console.error(`Error processing card in collection ${cardIndex}:`, cardError);
          logContent += `Error processing card in collection ${cardIndex}: ${cardError.message}\n`;
        }
      });

      if (!cardsChanged) {
        console.log('No changes in card prices.');
        logContent += 'No changes in card prices.\n';
      }
    });
  } catch (error) {
    console.error('Error processing collection:', error);
    logError(error, error.message, null, {
      source: 'processCollection',
      debugInfo: {
        data: data,
      },
    });
    logContent += `Error processing collection: ${error.message}\n`;
  }

  return logContent;
};

// logCollection - Logs the collection data processed by processCollection
function logCollection(collection) {
  try {
    if (typeof collection !== 'object' || collection === null) {
      throw new Error('Invalid collection data provided for logging.');
    }

    let logContent = '----- Collection Data Log -----\n\n';
    logContent += '|'.blue;
    logContent += `| DATE LOGGED: ${formatDateTime(new Date())}\n`.blue;
    logContent += '|____________________________|'.blue;
    logContent += '\n';
    logContent += processCollection(collection);
    logContent += '----- End of Collection Data Log -----\n\n';

    // fs.appendFileSync(`${logsDir}/collection-data-logs.log`, logContent, (err) => {
    //   if (err) throw err;
    // });
    // safeAppendFile(`${logsDir}/collection-data-logs.log`);
    console.log('Collection data logged successfully.'.green);
    return logContent;
  } catch (error) {
    // console.error(`[ERROR] Failed to log collection data: ${error.message}`.red);
    logError(error, error.message, null, {
      source: 'logCollection',
      debugInfo: {
        data: collection,
      },
    });
    safeAppendFile(`${logsDir}/error.log`, `[${new Date().toISOString()}] ${error.stack}\n`);
  }
}

// Log General info
const logGeneralInfo = (data, data2) => {
  let logContent = '--------------------\n';
  logContent += `| ${data}\n`;

  // Checking if data2 is an object and then stringifying it
  if (typeof data2 === 'object' && data2 !== null) {
    logContent += `| ${JSON.stringify(data2, null, 2)}\n`; // The 'null, 2' arguments format the JSON with indentation for readability
  } else {
    logContent += `| ${data2}\n`; // If data2 is not an object, log it as it is
  }

  logContent += '____________________\n\n';
  return logContent;
};
// Log Single Card
function logSingleCard(card) {
  if (!card) {
    console.error('No card data provided.'.red);
    return '';
  }

  let logContent = '----- Start of Single Card Log -----\n'.green;
  // console.log(logContent);
  logContent += processCard(card);
  // logContent += formatCardDetails(card);
  logContent += '----- End of Single Card Log -----\n'.red;
  console.log('----- End of Single Card Log -----\n'.red);
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
  logCollection(collection.updatedCollection ? collection.updatedCollection : collection);
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
    logCollection(collection);
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
function logData(data, data2) {
  const logType = determineLogType(data, data2);
  let logContent = '';
  logContent += '[INFO] '.blue;
  console.log(logContent.blue + logType);
  switch (logType) {
    case LOG_TYPES.GENERAL:
      logContent += '[GENERAL] '.yellow + `${new Date().toISOString()}\n`;
      console.log(logContent);
      logContent = logGeneralInfo(data, data2);
      console.log(logContent);
      break;
    case LOG_TYPES.CARD:
      logContent = '----- Start of Single Card Log -----\n'.green;
      logContent += '[SINGLE CARD] '.grey + `${new Date().toISOString()}`;
      console.log(logContent);
      logContent = logSingleCard(data);
      // console.log(logContent);
      break;
    case LOG_TYPES.CARDS:
      logContent += '[MULTIPLE CARD] '.yellow + `${new Date().toISOString()}\n`;
      console.log(logContent);
      logContent = logMultipleCards(data);
      break;
    case LOG_TYPES.COLLECTION:
      logContent += '[SINGLE COLLECTION] '.yellow + `${new Date().toISOString()}\n`;
      console.log(logContent);
      logContent = logSingleCollection(data);
      console.log(logContent);
      break;
    case LOG_TYPES.COLLECTIONS:
      logContent += '[MULTIPLE COLLECTION] '.yellow + `${new Date().toISOString()}\n`;
      console.log(logContent);
      logContent = logMultipleCollections(data);
      break;
    default:
      logContent += '[OTHER] '.yellow + `${new Date().toISOString()}\n`;
      console.log(logContent);
      logContent = logOtherData(data);
      break;
  }

  const logFileName = getLogFileName(logType);
  safeAppendFile(`${logsDir}/${logFileName}`, logContent);
}

function logError(error, errorType, problematicValue, additionalInfo = {}) {
  let errorContent = '[ERROR] '.red + `${new Date().toISOString()}\n`;
  console.log(errorContent.red);
  errorContent += '|----- Error Log -----\n\n';
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
    functionName: additionalInfo.source || 'Unknown',
    errorMessage: error.message,
    errorType: error.constructor.name,
    requestInfo: additionalInfo.request || 'N/A',
    errorStack: error.stack,
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
  logger.log({
    level: 'error',
    message: `Error in ${errorLog.function || 'unknown'}: ${error.message}`,
    meta: { stack: error.stack, ...errorLog },
  });
  // fs.appendFileSync(`${logsDir}/error.log`, errorContent.replace(/\[\d+m/g, ''), (err) => {
  //   if (err) console.error('Error writing to error log file'.red);
  // });
  safeAppendFile(`${logsDir}/error.log`, `[${new Date().toISOString()}] ${error.stack}\n`);
}

const logPriceChange = (changeStatus, card, latestPriceUpdated, latestPriceOld) => {
  try {
    if (!card) {
      throw new Error('[logPriceChange] -----> Invalid card data provided for logging.');
    }

    const priceDifference = latestPriceUpdated - latestPriceOld;
    const messagePrefix =
      changeStatus === 'CHANGE'
        ? `[CHANGE] [CARD]: ${card.name} (ID: ${
            card.id
          }) - Initial Price: $${latestPriceUpdated.toFixed(2)}`.yellow
        : `[NO_CHANGE] [CARD] ${card.name} (ID: ${card.id})`;
    let message = `${card.name} (ID: ${card.id}) price has `;
    message +=
      priceDifference > 0
        ? `increased by $${priceDifference.toFixed(2)}`.green
        : priceDifference < 0
          ? `decreased by $${Math.abs(priceDifference).toFixed(2)}`.red
          : 'no significant change'.blue;

    // logData(messagePrefix + ' - ' + message);
    console.log(messagePrefix + ' - ' + message);
    // fs.appendFileSync(`${logsDir}/price-changes.log`, `${new Date().toISOString()} - ${message}\n`);
    safeAppendFile(`${logsDir}/price-changes.log`, `${new Date().toISOString()} - ${message}\n`);
  } catch (error) {
    logError(error);
    // safeAppendFile(`${logsDir}/error.log`, `[${new Date().toISOString()}] ${error.stack}\n`);
  }
};

module.exports = {
  logData,
  logError,
  logPriceChange,
};
