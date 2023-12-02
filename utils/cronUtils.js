const CustomError = require('../middleware/customError');
const cron = require('node-cron');
const { logToAllSpecializedLoggers } = require('../middleware/infoLogger');
const { getIO } = require('../socket');
// const { logError, logData } = require('./logPriceChanges');
const { logError, logData } = require('./loggingUtils');
const { trackCardPrices } = require('./cronPriceTracking');
const { LOG_TYPES } = require('../constants');

let emittedResponses = [];
const cronQueue = [];
let responseIndex = 0;
let isJobRunning = false;

async function processCardPriceRequest(data, io) {
  const userId = data.userId;
  // console.log('processCardPriceRequest', userId);
  // console.log('DATA', data.selectedList);
  const selectedList = data.data.selectedList;
  // console.log('DATA [______________', selectedList, '______________]');
  const monitoredCards = selectedList || [];
  // console.log('processCardPriceRequest', { userId, selectedList, monitoredCards });
  try {
    if (!userId || !Array.isArray(monitoredCards)) {
      throw new CustomError('Invalid inputs provided to scheduleCheckCardPrices.', 400);
    }
    const updates = await trackCardPrices(monitoredCards, userId);

    if (updates.length > 0) {
      console.log('processCardPriceRequest', updates.slice(0, 5));
    }

    emitResponse(io, 'SEND_PRICING_DATA_TO_CLIENT', {
      message: 'Card prices checked',
      data: {
        message: userId,
        data: updates,
      },
    });
  } catch (error) {
    logError(error, error.message, {
      functionName: 'processCardPriceRequest',
      request: 'SEND_PRICING_DATA_TO_CLIENT',
      user: userId || 'No user ID provided',
      section: 'error',
      action: 'logs',
      debug: {
        /* relevant debug info */
      },
    });

    emitError(io, 'ERROR', error);
  }
}

function setupCronJob(io, jobFunction, cronSchedule) {
  cron.schedule(cronSchedule, () => {
    if (!isJobRunning) {
      addJobToQueue(() => jobFunction());
      executeNextCronJob(io);
    }
  });
}

const emitResponse = (io, eventType, response) => {
  // Log and emit the response
  logResponseData(response);
  io.emit(eventType, response);
  addToEmittedResponses(response, eventType);
};

const emitError = (io, errorType, error) => {
  // Handle and log errors
  const errorDetails = getCustomErrorDetails(error);
  // logErrorDetails(errorDetails, errorType);
  logError(error, error.message, {
    functionName: 'emitError',
    request: 'ERROR_MESSAGE',
    user: 'No user ID provided',
    section: 'error',
    action: 'logs',
    debug: {
      /* relevant debug info */
    },
  });
  emitResponse(io, errorType, {
    status: 'ERROR',
    message: 'An error has occurred',
    error: errorDetails,
  });
};

const executeNextCronJob = async (io) => {
  if (cronQueue.length === 0 || isJobRunning) return;

  isJobRunning = true;
  const nextJob = cronQueue.shift();

  try {
    const updates = await nextJob();
    io.emit('STATUS_UPDATE_CRON', { message: 'Cron job completed', data: updates });
  } catch (error) {
    logError(error, error.message, {
      functionName: 'executeNextCronJob',
      request: 'STATUS_UPDATE_CRON',
      user: 'No user ID provided',
      section: 'error',
      action: 'logs',
      debug: {
        /* relevant debug info */
      },
    });
    emitError(io, 'ERROR', error);
  } finally {
    isJobRunning = false;
    executeNextCronJob(io);
  }
};

function logResponseData(response) {
  const dataToLog = Array.isArray(response.data) ? response.data.slice(0, 5) : response.data;
  logData(dataToLog);
}

function addToEmittedResponses(response, eventType) {
  emittedResponses.push({ index: responseIndex++, eventType, timestamp: new Date(), response });
  getIO().emit('EMITTED_RESPONSES', { message: 'YES', data: emittedResponses.slice(-25) });
}

function getCustomErrorDetails(error) {
  return error instanceof CustomError
    ? error
    : new CustomError(error.message || 'An error occurred', 500, true, error);
}

const addJobToQueue = (job) => {
  cronQueue.push(job);
};

const clearQueue = () => {
  cronQueue.length = 0;
};

const getQueue = () => {
  return cronQueue;
};

const getQueueLength = () => {
  return cronQueue.length;
};

const getEmittedResponses = () => {
  return emittedResponses;
};

const getEmittedResponsesLength = () => {
  return emittedResponses.length;
};

const clearEmittedResponses = () => {
  emittedResponses.length = 0;
};

const filterOldEventTypes = () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  emittedResponses = emittedResponses.filter((response) => response.timestamp > oneHourAgo);
};

module.exports = {
  emitResponse,
  emitError,
  executeNextCronJob,
  addJobToQueue,
  clearQueue,
  getQueue,
  getQueueLength,
  getEmittedResponses,
  getEmittedResponsesLength,
  clearEmittedResponses,
  filterOldEventTypes,
  processCardPriceRequest,
  setupCronJob,
};
