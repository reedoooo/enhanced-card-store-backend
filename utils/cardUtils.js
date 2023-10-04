const { default: mongoose } = require('mongoose');
const { ChartData } = require('../models/ChartData');
const { default: axios } = require('axios');
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
  try {
    return mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error('Invalid userId for conversion to ObjectId:', userId);
    return null;
  }
};

// [4] Function: getCardPriceHistory - Get Card Price History
const getCardPriceHistory = async (cardId) => {
  try {
    return await ChartData.find({ cardId }).sort({ date: 1 });
  } catch (error) {
    console.error('Error fetching price history: ', error);
    return [];
  }
};

// [5] Function: validateCardData - Validate Card Data
const validateCardData = (card) => {
  if (!card || typeof card !== 'object' || !card.card_prices || !Array.isArray(card.card_prices)) {
    console.error('Invalid card data: ', card);
    return false;
  }
  return true;
};

module.exports = {
  getCardInfo,
  convertUserIdToObjectId,
  getCardPriceHistory,
  validateCardData,
};
