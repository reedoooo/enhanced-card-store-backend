const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const { updateUserCollections } = require('../routes/other/cronJob');
const { CronData } = require('../models/CronData');
const { getIO } = require('../socket');
const CustomError = require('../middleware/customError');
const handleError = (error) => {
  console.error(error);
  // ... other error handling logic
};
const {
  logger,
  cardPriceLogger,
  cronJobLogger,
  logToAllSpecializedLoggers,
} = require('../middleware/infoLogger');
// const { handleError } = require('../middleware/handleErrors');
const { convertUserIdToObjectId } = require('./utils');
const User = require('../models/User');

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

const updateCardPricesAndReport = async (userId, cardsToCheck) => {
  try {
    const updatedCards = [];
    const untouchedCards = [];
    const invalidCards = [];

    for (const card of cardsToCheck) {
      if (!card.id) {
        invalidCards.push(card);
        continue;
      }

      try {
        const latestInfo = await fetchCardInfo(card.id);
        const latestPrice = parseFloat(latestInfo?.card_prices[0]?.tcgplayer_price || '0');
        const hasPriceChanged = latestPrice !== card.previousPrice;

        if (hasPriceChanged) {
          updatedCards.push({ ...card, latestPrice, status: 'updated' });
        } else {
          untouchedCards.push({ ...card, status: 'unchanged' });
        }
      } catch (error) {
        console.error('Error fetching card info:', error.message);
      }
    }

    const user = await User.findById(userId).populate('collections');
    updatedCards.forEach((card) => {
      updateCollectionPrices(user.collections, card);
    });

    const allCards = [...updatedCards, ...untouchedCards];
    const priceReport = generatePriceReport(allCards);
    await logPriceUpdate({
      totalCardsChecked: cardsToCheck.length,
      invalidCards,
      updatedCards,
      priceReport,
    });

    return { updatedCards, priceReport };
  } catch (error) {
    handleError(error);
  }
};

const generatePriceReport = (cardsWithPriceChanges) => {
  const priceReport = cardsWithPriceChanges.reduce(
    (report, card) => {
      const priceDifference = parseFloat((card.latestPrice - card.previousPrice).toFixed(2));
      report.updatedPrices[card.id] = {
        ...card,
        difference: priceDifference,
        lastUpdated: new Date(),
      };
      report.totalDifference += priceDifference;
      return report;
    },
    { updatedPrices: {}, totalDifference: 0 },
  );

  return priceReport;
};

// Fetches the latest card information from the database or external API
const fetchCardInfo = async (cardId) => {
  // Logic to fetch the latest card info
};

// Updates the price of the card in user's collection
const updateCollectionPrices = (collections, card) => {
  collections.forEach((collection) => {
    const cardToUpdate = collection.cards.find((c) => c.id === card.id);
    if (cardToUpdate) {
      cardToUpdate.price = card.latestPrice;
      cardToUpdate.totalPrice = card.latestPrice * cardToUpdate.quantity;
    }
  });
};

// Logs the results of the price update
const logPriceUpdate = async (resultData) => {
  // Logic to log the price update results
};

// Generates a report for the price updates
const generatePriceReport = (cardsWithPriceChanges) => {
  const priceReport = cardsWithPriceChanges.reduce(
    (report, card) => {
      const priceDifference = parseFloat((card.latestPrice - card.previousPrice).toFixed(2));
      report.updatedPrices[card.id] = {
        ...card,
        difference: priceDifference,
        lastUpdated: new Date(),
      };
      report.totalDifference += priceDifference;
      return report;
    },
    { updatedPrices: {}, totalDifference: 0 },
  );

  return priceReport;
};

// Function to initiate the price check and update process
const initiateCardPriceEvaluation = async (userId, cardsToCheck) => {
  try {
    if (!userId || !Array.isArray(cardsToCheck)) {
      throw new Error('Invalid arguments for initiateCardPriceEvaluation');
    }

    const { updatedCards, priceReport } = await updateCardPricesAndReport(userId, cardsToCheck);

    return {
      priceReport,
      pricesUpdated: updatedCards.length > 0,
      updatedCards: updatedCards,
    };
  } catch (error) {
    handleError(error);
    throw error;
  }
};

const handlePriceUpdates = async (userId, updatedCards, priceReport) => {
  try {
    if (updatedCards.length > 0) {
      // Implement the actions to be taken when prices have been updated
      // For example, logging and updating the user's collection:
      await logPriceUpdate({
        userId,
        updates: priceReport,
        message: 'Prices have been updated.',
      });
      // And update the user's collection, if necessary
      // await updateUserCollections(userId, updatedCards);
    } else {
      // Implement the actions to be taken when no updates are required
      // For example, logging the absence of changes:
      await logPriceUpdate({
        userId,
        updates: priceReport,
        message: 'No price updates required.',
      });
    }
  } catch (error) {
    handleError(error);
  }
};
