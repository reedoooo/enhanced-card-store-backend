const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const { updateUserCollections } = require('../routes/other/cronJob');
const { CronData } = require('../models/CronData');
const { getIO } = require('../socket');
const CustomError = require('../middleware/customError');
const { logger, logToAllSpecializedLoggers, logPriceChanges } = require('../middleware/infoLogger');
const { handleError } = require('../middleware/handleErrors');
const { convertUserIdToObjectId } = require('./utils');
const User = require('../models/User');
const saveCardPriceHistory = require('./saveCardPriceHistory');

require('colors');

const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

const logResults = async ({
  testedItemCount,
  itemsWithoutValidID,
  cardsWithChangedPrices,
  pricingData,
}) => {
  try {
    logToAllSpecializedLoggers('info', 'Total items tested:', {
      section: 'cronjob',
      action: 'log',
      data: testedItemCount,
    });
    logToAllSpecializedLoggers(
      'info',
      `Items without a valid ID: ${JSON.stringify(itemsWithoutValidID)}`,
      {
        section: 'cronjob',
        action: 'log',
        data: itemsWithoutValidID,
      },
    );
    logToAllSpecializedLoggers(
      'info',
      `Cards with changed prices: ${cardsWithChangedPrices.length}`,
      {
        section: 'cronjob',
        action: 'log',
        data: cardsWithChangedPrices,
      },
    );
    logToAllSpecializedLoggers('info', 'Pricing data:', {
      section: 'cronjob',
      action: 'log',
      data: pricingData,
    });
  } catch (error) {
    logToAllSpecializedLoggers('error', 'Error occurred in logResults:', {
      section: 'error',
      error,
    });
  }
};

const getCardInfo = async (cardId) => {
  if (!cardId) {
    throw new CustomError('No card ID provided.', 400);
  }

  try {
    const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    return data.data[0];
  } catch (error) {
    throw new CustomError('Failed to get card information', 500, true, {
      function: 'getCardInfo',
      cardId,
      error: error.message,
      stack: error.stack,
    });
  }
};

const processCardPrices = async (userId, selectedList) => {
  try {
    const itemsWithoutValidID = [];
    const cardsWithPriceHistory = [];

    // Using map to handle promises simultaneously where possible
    await Promise.all(
      selectedList.map(async (card) => {
        if (!card.id) {
          itemsWithoutValidID.push(card);
          return; // Equivalent to "continue" in a for..of loop
        }

        const latestCardInfo = await getCardInfo(card.id);
        if (!latestCardInfo || !latestCardInfo.card_prices) return;

        const latestCardPrice = parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || '0');
        const priceHistory = card.priceHistory || [];

        if (
          !priceHistory.length ||
          priceHistory[priceHistory.length - 1].price !== latestCardPrice
        ) {
          const newPriceEntry = { price: latestCardPrice, timestamp: new Date().toISOString() };
          priceHistory.push(newPriceEntry);

          await saveCardPriceHistory(card.id, newPriceEntry); // Assuming this function only needs card ID and new price entry
        }

        cardsWithPriceHistory.push({
          ...card,
          priceHistory,
          latestCardPrice,
        });
      }),
    );

    const user = await User.findById(userId).populate('allCollections');
    let numCardsWithCheckedPrices = 0;

    cardsWithPriceHistory.forEach((card) => {
      const collection = user.allCollections.find((col) => col.cards.includes(card.id));
      if (collection) {
        const cardInCollection = collection.cards.find((c) => c.id === card.id);
        if (cardInCollection) {
          numCardsWithCheckedPrices++;
          cardInCollection.price = card.latestCardPrice;
          cardInCollection.totalPrice = card.latestCardPrice * cardInCollection.quantity;
        }
      }
    });

    return { cardsWithPriceHistory, numCardsWithCheckedPrices };
  } catch (error) {
    handleError(error);
  }
};

const checkCardPrices = async (userId, selectedList) => {
  try {
    // Validate the input arguments
    if (!userId || !Array.isArray(selectedList)) {
      throw new CustomError('Invalid arguments for checkCardPrices', 400);
    }

    // Process card prices and get cards with price history
    const { cardsWithPriceHistory, numCardsWithCheckedPrices } = await processCardPrices(
      userId,
      selectedList,
    );

    // Log results
    await logResults({ cardsWithPriceHistory, numCardsWithCheckedPrices });

    let pricingData = {};
    if (cardsWithPriceHistory.length > 0) {
      // Prepare pricing data using the helper function
      pricingData = preparePricingData(cardsWithPriceHistory);

      // Use the logPriceChanges function to log the price changes
      logPriceChanges(pricingData.updatedPrices);
    } else {
      logger.info('No updated prices. Skipping collection update.');
    }

    // Log the number of cards with changed prices
    logToAllSpecializedLoggers(
      'info',
      `Cards with changed prices: ${cardsWithPriceHistory.length} out of ${numCardsWithCheckedPrices} cards checked.`,
      {
        section: 'cronjob',
        action: 'log',
        data: cardsWithPriceHistory,
      },
    );

    // Return the results
    return {
      pricesUpdated: cardsWithPriceHistory.length > 0,
      cardsWithPriceHistory: cardsWithPriceHistory,
      pricingData: pricingData,
    };
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Refactored helper function to prepare pricing data
function preparePricingData(cardsWithChangedPrices) {
  const updatedPrices = {};
  const previousPrices = {};
  const priceDifferences = {};
  let totalDifference = 0;

  for (const { id, name, updatedPrice, previousPrice, tag } of cardsWithChangedPrices) {
    const diff = parseFloat((updatedPrice - previousPrice).toFixed(2));
    updatedPrices[id] = {
      id,
      name,
      previousPrice,
      updatedPrice,
      difference: diff,
      tag,
      lastUpdated: new Date(),
    };
    previousPrices[id] = previousPrice;
    priceDifferences[id] = diff;
    totalDifference += diff;
  }

  const sortedUpdatedPrices = Object.values(updatedPrices)
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .reduce((acc, priceObj) => {
      acc[priceObj.id] = priceObj;
      return acc;
    }, {});

  return {
    updatedPrices: sortedUpdatedPrices,
    previousPrices,
    priceDifferences,
    totalDifference,
  };
}
const scheduledTasks = new Map();

const scheduleCheckCardPrices = async (userId, selectedList) => {
  const io = getIO();

  try {
    if (!userId || !Array.isArray(selectedList)) {
      throw new CustomError('Invalid inputs provided to scheduleCheckCardPrices.', 400);
    }

    // cronJobLogger.info('Scheduling cron job for userId:', userId);
    // cronJobLogger.info('Scheduled tasks:', scheduledTasks);
    if (scheduledTasks.has(userId)) {
      io.emit('ERROR', { message: 'A task is already running for this userId.' });
      return;
    }

    const task = cron.schedule(
      '*/3 * * * *',
      async () => {
        try {
          const { pricesUpdated, cardsWithPriceHistory } = await checkCardPrices(
            userId,
            selectedList,
          );
          let existingCronData = await CronData.findOne({ userId });

          if (!existingCronData) {
            existingCronData = new CronData({ userId, runs: [] });
          }

          existingCronData.runs.push({
            updated: new Date(),
            valuesUpdated: pricesUpdated,
            cardsWithPriceHistory: cardsWithPriceHistory,
          });
          await existingCronData.save();

          io.emit('RESPONSE_CRON_DATA', {
            message: `Cron job updated prices at ${new Date().toLocaleString()}`,
            existingCronData,
          });
        } catch (error) {
          io.emit('ERROR_MESSAGE', {
            message: 'Failed to execute scheduled task.',
            detail: error.message,
          });
          console.error('Scheduled Task Error:', error.message, '\nStack:', error.stack);
        }
      },
      { scheduled: false },
    );

    task.start();
    scheduledTasks.set(userId, task);
    io.emit('RESPONSE_CRON_STARTED', { message: 'Cron job started.', userId });
    logToAllSpecializedLoggers('info', 'Cron job started', {
      section: 'cronjob',
      action: 'log',
      data: userId,
    });
    // cronJobLogger.info('Cron job started for userId:', userId);
  } catch (error) {
    handleError(error);
    throw error;
  }
};

const stopCheckCardPrices = (userId) => {
  if (!userId) {
    throw new CustomError('No userId provided for stopping the cron job.', 400);
  }

  const task = scheduledTasks.get(userId);
  if (!task) {
    throw new CustomError('No scheduled task found for this userId.', 404);
  }

  task.stop();
  scheduledTasks.delete(userId);
  getIO().emit('RESPONSE_CRON_STOPPED', { message: 'Cron job stopped.', userId });
  logToAllSpecializedLoggers('info', 'Cron job stopped for userId:', {
    section: 'cronjob',
    action: 'log',
    data: userId,
  });
  // cronJobLogger.info('Cron job stopped for userId:', userId);
};

module.exports = {
  checkCardPrices,
  scheduleCheckCardPrices,
  stopCheckCardPrices,
  getCardInfo,
  convertUserIdToObjectId,
};
