const CustomError = require('../middleware/customError');
const cron = require('node-cron');
const { getIO } = require('../socket');
const { logError, logData } = require('./loggingUtils');
// const { trackCardPrices } = require('./cronPriceTracking');
// const { ERROR_TYPES } = require('../constants');
const { checkAndUpdateCardPrices } = require('./test');

let emittedResponses = [];
const cronQueue = [];
let responseIndex = 0;
let isJobRunning = false;
function logResponseData(response) {
  const dataToLog = Array.isArray(response.data) ? response.data.slice(0, 5) : response.data;
  logData(dataToLog);
}
const emitResponse = (io, eventType, response) => {
  logResponseData(response);
  io.emit(eventType, response);
  addToEmittedResponses(response, eventType);
};

const emitError = (io, errorType, error) => {
  const errorDetails = getCustomErrorDetails(error);
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
async function processCardPriceRequest(data, io) {
  const userId = data?.userId;
  const selectedList = data?.data?.selectedList;

  try {
    if (!userId || !Array.isArray(selectedList)) {
      throw new CustomError('Invalid inputs provided to scheduleCheckCardPrices.', 400);
    }

    await checkAndUpdateCardPrices(selectedList, io);
  } catch (error) {
    logError(error, error.message, {
      functionName: 'processCardPriceRequest',
      request: 'SEND_PRICING_DATA_TO_CLIENT',
      user: userId || 'No user ID provided',
      section: 'error',
      action: 'logs',
      debug: { selectedList, userId },
    });
    emitError(io, 'ERROR', error);
  }
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

function setupCronJob(io, jobFunction, cronSchedule) {
  // Ensure the jobFunction is a function and cronSchedule is a valid cron string
  if (typeof jobFunction !== 'function' || typeof cronSchedule !== 'string') {
    throw new Error('Invalid jobFunction or cronSchedule');
  }

  cron.schedule(cronSchedule, async () => {
    if (!isJobRunning) {
      isJobRunning = true;
      try {
        // Execute the job function
        await jobFunction();
      } catch (error) {
        logError(error, error.message, {
          functionName: 'setupCronJob',
          request: 'STATUS_UPDATE_CRON',
          user: 'No user ID provided',
          section: 'error',
          action: 'logs',
          debug: {},
        });
        emitError(io, 'ERROR', error);
      } finally {
        isJobRunning = false;
      }
    }
  });
}

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

function addToEmittedResponses(response, eventType) {
  emittedResponses.push({ index: responseIndex++, eventType, timestamp: new Date(), response });
  getIO().emit('EMITTED_RESPONSES', { message: 'YES', data: emittedResponses.slice(-25) });
}

function getCustomErrorDetails(error) {
  return error instanceof CustomError
    ? error
    : new CustomError(error.message || 'An error occurred', 500, true, error);
}

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
