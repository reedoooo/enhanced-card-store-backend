const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const { updateUserCollections } = require('../routes/other/cronJob');
const { CronData } = require('../models/CronData');
const { getIO } = require('../socket');
const CustomError = require('../middleware/customError');
const { logger, cardPriceLogger, cronJobLogger } = require('../middleware/infoLogger');
const { handleError } = require('../middleware/handleErrors');

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
    cardPriceLogger.info('Total items tested:', testedItemCount);

    if (itemsWithoutValidID.length > 0) {
      cardPriceLogger.warn('Items without a valid ID:', itemsWithoutValidID);
    }

    cardPriceLogger.info('Cards with changed prices:', cardsWithChangedPrices.length);
    cardPriceLogger.info('Pricing data:', pricingData);
  } catch (error) {
    handleError(error);
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
    handleError(
      new CustomError('Failed to get card information', 500, true, {
        function: 'getCardInfo',
        cardId,
        error: error.message,
        stack: error.stack,
      }),
    );
  }
};

const convertUserIdToObjectId = (userId) => {
  try {
    return mongoose.Types.ObjectId(userId);
  } catch (error) {
    throw new CustomError('Failed to convert user ID to ObjectId', 400, true, {
      function: 'convertUserIdToObjectId',
      userId,
      error: error.message,
      stack: error.stack,
    });
  }
};

const processCardPrices = async (userId, selectedList) => {
  try {
    const cardsWithChangedPrices = [];
    const itemsWithoutValidID = [];
    let testedItemCount = 0;

    for (const card of selectedList) {
      testedItemCount++;
      if (!card.id) {
        itemsWithoutValidID.push(card);
        continue;
      }

      try {
        const latestCardInfo = await getCardInfo(card.id);
        if (!latestCardInfo || !latestCardInfo.card_prices) continue;

        const updatedPrice = parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || '0');
        const previousPrice = card.previousPrice;

        if (updatedPrice !== previousPrice) {
          cardsWithChangedPrices.push({
            ...card,
            updatedPrice,
            tag: 'updated',
          });
        }
      } catch (error) {
        cardPriceLogger.error('Error occurred while checking card prices:', error.message);
      }
    }

    const pricingData = createPricingData(cardsWithChangedPrices);
    await logResults({ testedItemCount, itemsWithoutValidID, cardsWithChangedPrices, pricingData });

    return { cardsWithChangedPrices, pricingData };
  } catch (error) {
    handleError(error);
  }
};

const checkCardPrices = async (userId, selectedList) => {
  try {
    if (!userId || !Array.isArray(selectedList)) {
      throw new CustomError('Invalid arguments for checkCardPrices', 400);
    }

    const { cardsWithChangedPrices, pricingData } = await processCardPrices(userId, selectedList);
    await handlePriceUpdates(userId, cardsWithChangedPrices, pricingData);
    return {
      pricingData,
      pricesUpdated: cardsWithChangedPrices.length > 0,
      cardsWithChangedPrices: cardsWithChangedPrices,
    };
  } catch (error) {
    handleError(error);
    throw error;
  }
};

const handlePriceUpdates = async (userId, cardsWithChangedPrices, pricingData) => {
  try {
    if (cardsWithChangedPrices.length > 0) {
      cronJobLogger.info('Prices have shifted. Activating the cronJob.');
      await updateUserCollections(userId, pricingData);
    } else {
      cronJobLogger.info('Prices have not shifted. Skipping cronJob.');
    }
  } catch (error) {
    handleError(error);
  }
};

const createPricingData = (cardsWithChangedPrices) => {
  try {
    if (!Array.isArray(cardsWithChangedPrices)) {
      throw new CustomError('Invalid input: Expected an array of cards with changed prices.', 400);
    }

    if (cardsWithChangedPrices.length === 0) {
      logger.info('No updated prices. Skipping collection update.');
      return { message: 'No updated prices. Collection update skipped.' };
    }

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
  } catch (error) {
    handleError(error);
  }
};

const scheduledTasks = new Map();

const scheduleCheckCardPrices = async (userId, selectedList) => {
  try {
    if (!userId || !Array.isArray(selectedList)) {
      throw new CustomError('Invalid inputs provided to scheduleCheckCardPrices.', 400);
    }

    const io = getIO();
    if (scheduledTasks.has(userId)) {
      io.emit('ERROR_MESSAGE', { message: 'A task is already running for this userId.' });
      return;
    }

    const task = cron.schedule(
      '*/3 * * * *',
      async () => {
        try {
          const pricingData = await checkCardPrices(userId, selectedList);
          let existingCronData = await CronData.findOne({ userId });

          if (!existingCronData) {
            existingCronData = new CronData({ userId, runs: [] });
          }

          existingCronData.runs.push({ updated: new Date(), valuesUpdated: pricingData });
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
    cronJobLogger.info('Cron job started for userId:', userId);
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
  cronJobLogger.info('Cron job stopped for userId:', userId);
};

module.exports = {
  checkCardPrices,
  scheduleCheckCardPrices,
  stopCheckCardPrices,
  getCardInfo,
  convertUserIdToObjectId,
  createPricingData,
};
