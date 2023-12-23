const CustomError = require('../middleware/customError');
const cron = require('node-cron');
const { getIO } = require('../socket');
const { logError, logData } = require('./loggingUtils');
const { checkAndUpdateCardPrices } = require('./test');
const CardInCollection = require('../models/CardInCollection');
const Collection = require('../models/Collection');

let emittedResponses = [];
const cronQueue = [];
let responseIndex = 0;
let isJobRunning = false;
function logResponseData(response) {
  const dataToLog = Array.isArray(response.data) ? response.data.slice(0, 5) : response.data;
  logData('LOGGING RESPONSE DATA', dataToLog);
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

// Helper function to create a new chart data entry
const createChartDataEntry = (price) => {
  return {
    date: new Date(),
    price: price,
  };
};

// Function to update the daily collection price history data
const updateDailyCollectionPriceHistoryData = async (userId) => {
  try {
    // Fetch all collections for the user
    const collections = await Collection.find({ userId: userId });

    // Map each collection to a promise that updates its price history
    const updatePromises = collections.map(async (collection) => {
      // Calculate the total price of the collection for the day
      const totalPriceForDay = collection.cards.reduce((total, card) => {
        return total + card.quantity * card.latestPrice.num;
      }, 0);

      // Create a new chart data entry for today
      const newChartDataEntry = createChartDataEntry(totalPriceForDay);

      // Add new entry to collection's price history
      collection.collectionPriceHistory.push(newChartDataEntry);

      // Save the updated collection
      return collection.save();
    });

    // Wait for all update operations to complete
    await Promise.all(updatePromises);
  } catch (error) {
    throw new Error(`Error updating daily collection price history: ${error.message}`);
  }
};

const updateChartDataForCards = async (selectedList) => {
  // Map each card to a promise that updates its data
  const updatePromises = selectedList.map(async (card) => {
    const cardInCollection = await CardInCollection.findOne({ id: card.id });

    if (cardInCollection) {
      const newChartDataEntry = createChartDataEntry(cardInCollection.latestPrice.num);
      cardInCollection.chart_datasets.push(newChartDataEntry);
      return cardInCollection.save(); // Return the promise
    } else {
      console.error(`Card with ID ${card.id} not found in CardInCollection`);
      return Promise.resolve(); // Return a resolved promise for non-existing cards
    }
  });

  // Wait for all update operations to complete
  await Promise.all(updatePromises);
};

async function processCardPriceRequest(data, io) {
  const userId = data?.userId;
  const selectedList = data?.data?.selectedList;

  try {
    if (!userId || !Array.isArray(selectedList)) {
      throw new CustomError('Invalid inputs provided to scheduleCheckCardPrices.', 400);
    }

    await checkAndUpdateCardPrices(userId, selectedList, io);

    // Schedule the chart data update job if it hasn't been scheduled
    scheduleUpdateChartDataJob(io, selectedList);
    scheduleUpdateDailyCollectionPriceHistoryDataJob(io, selectedList);
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

// Function to schedule the chart data update job
const scheduleUpdateChartDataJob = (io, selectedList) => {
  const cronSchedule = '0 10 * * *'; // Every day at midnight

  setupCronJob(io, () => updateChartDataForCards(selectedList), cronSchedule);
};
const scheduleUpdateDailyCollectionPriceHistoryDataJob = (io, selectedList) => {
  const cronSchedule = '0 10 * * *'; // Every day at midnight

  setupCronJob(io, () => updateDailyCollectionPriceHistoryData(selectedList), cronSchedule);
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
