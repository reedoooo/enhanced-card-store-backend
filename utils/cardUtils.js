const mongoose = require('mongoose');
// const { ChartData } = require('../models/ChartData');
const cron = require('node-cron');
const { default: axios } = require('axios');
const { updateUserCollections } = require('../routes/other/cronJob');
const { getIO } = require('../socket');
const { CronData } = require('../models/CronData');
const instance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});
const getCardInfo = async (cardId) => {
  try {
    const response = await instance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    return response.data.data[0];
  } catch (error) {
    console.error('Error fetching card info: ', error);
    return null;
  }
};

// [3] Function: convertUserIdToObjectId - Convert User ID to Object ID
const convertUserIdToObjectId = (userId) => {
  console.log('-------------> userid:', userId);
  try {
    return mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error('Invalid userId for conversion to ObjectId:', userId);
    return null;
  }
};

// // [4] Function: getCardPriceHistory - Get Card Price History
// const getCardPriceHistory = async (cardId) => {
//   try {
//     return await ChartData.find({ cardId }).sort({ date: 1 });
//   } catch (error) {
//     console.error('Error fetching price history: ', error);
//     return [];
//   }
// };

// [5] Function: validateCardData - Validate Card Data
const validateCardData = (card) => {
  if (!card || typeof card !== 'object' || !card.card_prices || !Array.isArray(card.card_prices)) {
    console.error('Invalid card data: ', card);
    return false;
  }
  return true;
};

const checkCardPrices = async (userId, selectedList) => {
  if (!userId || !Array.isArray(selectedList)) {
    console.error('Invalid arguments for checkCardPrices');
    return;
  }
  const io = getIO();
  let priceShifted = false;
  const updatedPrices = {};
  const previousPrices = {};
  const priceDifferences = {}; // New object to store the price differences

  for (const card of selectedList) {
    const latestCardInfo = await getCardInfo(card.id);
    if (!latestCardInfo || !latestCardInfo.card_prices) continue;

    updatedPrices[card.id] = parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || '0'); // Convert to number
    previousPrices[card.id] = card.previousPrice;

    // Compute the price difference for the card
    priceDifferences[card.id] = (updatedPrices[card.id] - previousPrices[card.id]).toFixed(2); // Assuming you want 2 decimal places

    if (updatedPrices[card.id] !== previousPrices[card.id]) {
      priceShifted = true;
    }
  }

  const pricingData = { updatedPrices, previousPrices, priceDifferences }; // Including priceDifferences in the pricingData object
  let message;
  if (priceShifted) {
    console.log('Emitting Data:', { message, pricingData });
    message = 'Prices have shifted. Activating the cronJob.';
    io.emit('RESPONSE_CRON_UPDATED_CARDS_IN_COLLECTION', {
      message: 'Cards have been updated',
      pricingData,
    });
    await updateUserCollections(userId, pricingData);
  } else {
    message = 'No card prices have shifted';
    io.emit('RESPONSE_CRON_UPDATED_CARDS_IN_COLLECTION', {
      message,
      pricingData,
    });
  }

  // console.log('Emitting Data:', { message, pricingData });
  return pricingData;
};
const scheduledTasks = new Map(); // Store tasks by userId

const scheduleCheckCardPrices = (userId, selectedList) => {
  const io = getIO();

  const task = cron.schedule('*/3 * * * *', async () => {
    try {
      const pricingData = await checkCardPrices(userId, selectedList);

      let existingCronData = await CronData.findOne({ userId });

      if (!existingCronData) {
        existingCronData = new CronData({
          userId,
          runs: [],
        });
      }

      existingCronData.runs.push({
        updated: new Date(),
        valuesUpdated: pricingData,
      });

      await existingCronData.save();

      io.emit('RESPONSE_CRON_DATA', {
        message: `Cron job updated prices at ${new Date().toLocaleTimeString()}`, // Using built-in toLocaleTimeString for formatting
        data: existingCronData,
      });
    } catch (error) {
      console.error('Error during checkCardPrices cron job:', error);
    }
  });

  task.start();
  scheduledTasks.set(userId, task);
};

const cronStop = (userId) => {
  const task = scheduledTasks.get(userId);
  if (task) {
    task.stop(); // Stop the task
    scheduledTasks.delete(userId); // Remove from our reference map
    console.log(`Cron job for userId ${userId} has been stopped.`);
  } else {
    console.error(`No scheduled cron job found for userId ${userId}.`);
  }
};

module.exports = {
  getCardInfo,
  convertUserIdToObjectId,
  validateCardData,
  scheduleCheckCardPrices,
  cronStop, // Exporting the cronStop function
};
