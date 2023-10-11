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
    console.log('latestCardInfo:', latestCardInfo);
    if (!latestCardInfo || !latestCardInfo.card_prices) continue;

    updatedPrices[card.id] = latestCardInfo.card_prices[0]?.tcgplayer_price;
    previousPrices[card.id] = card.previousPrice;

    // Compute the price difference for the card
    priceDifferences[card.id] = (updatedPrices[card.id] - previousPrices[card.id]).toFixed(2); // Assuming you want 2 decimal places

    if (updatedPrices[card.id] !== previousPrices[card.id]) {
      priceShifted = true;
    }
  }

  const pricingData = { updatedPrices, previousPrices, priceDifferences }; // Including priceDifferences in the pricingData object

  if (!priceShifted) {
    console.log('Emitting Data:', {
      message: 'No card prices have shifted',
      pricingData,
    });
    io.emit('RESPONSE_CRON_UPDATED_CARDS_IN_COLLECTION', {
      message: 'No card prices have shifted',
      pricingData,
    });
    return null;
  } else if (priceShifted) {
    console.log('Emitting Data:', {
      message: 'Prices have shifted. Activating the cronJob.',
      pricingData,
    });

    io.emit('RESPONSE_CRON_UPDATED_CARDS_IN_COLLECTION', {
      message: 'Cards have been updated',
      pricingData,
    });
    await updateUserCollections(userId, pricingData);
    return pricingData;
  } else {
    console.log('Emitting Data:', {
      message: 'An error occurred while processing your request.',
      pricingData,
    });
    io.emit('RESPONSE_CRON_UPDATED_CARDS_IN_COLLECTION', {
      message: 'An error occurred while processing your request to update cards in collections.',
      pricingData,
    });
    return null;
  }
};

const scheduleCheckCardPrices = (userId, selectedList) => {
  const io = getIO();

  const currentDate = new Date();
  const currentSeconds = currentDate.getSeconds();
  const currentMinutes = currentDate.getMinutes();
  const minutesToNextRun = 3 - (currentMinutes % 3);

  const cronTime = `*/${minutesToNextRun} * * * *`;
  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')}${period}`;
  };

  const task = cron.schedule(cronTime, async () => {
    try {
      const pricingData = await checkCardPrices(userId, selectedList);

      let existingCronData = await CronData.findOne({ userId: userId });

      if (!existingCronData) {
        existingCronData = new CronData({
          userId: userId,
          runs: [],
        });
      }

      existingCronData.runs.push({
        updated: new Date(),
        valuesUpdated: pricingData,
      });

      await existingCronData.save();
      // console.log('CronData saved successfully.', existingCronData);

      io.emit('RESPONSE_CRON_DATA', {
        message: `Cron job updated prices at ${formatTime(new Date())}`,
        data: existingCronData,
      });
    } catch (error) {
      console.error('Error during checkCardPrices cron job:', error);
    }
  });

  task.start();
};

module.exports = {
  getCardInfo,
  convertUserIdToObjectId,
  // getCardPriceHistory,
  validateCardData,
  scheduleCheckCardPrices,
};
