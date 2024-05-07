// const { default: axios } = require('axios');
const axios = require('axios'); // Additional axios import
const logger = require('../configs/winston');
const { createNewPriceEntry } = require('./dateUtils');
const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});
require('colors');
// !--------------------! Utility Functions !--------------------!
function queryBuilder(data) {
  // logger.info(
  //   `[SEARCH QUERY CONTENTS][${data.searchTerm}, ${data.race}, ${data.type}, ${data.level}, ${data.attribute}, ${data.id}]`,
  // );

  const queryParts = [
    data && `fname=${encodeURIComponent(data)}`,
    data.race && `race=${encodeURIComponent(data.race)}`,
    data.type && `type=${encodeURIComponent(data.type)}`,
    data.level && `level=${encodeURIComponent(data.level)}`,
    data.attribute && `attribute=${encodeURIComponent(data.attribute)}`,
    data.id && `id=${encodeURIComponent(data.id)}`,
  ].filter(Boolean);

  const fullQuery = queryParts.join('&');
  logger.info(`[SEARCH QUERY][${fullQuery}]`);
  return fullQuery;
}
function generateFluctuatingPriceData(days, basePrice) {
  const priceData = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const fluctuation = (Math.random() - 0.5) * 10; // Random fluctuation between -5 and 5
    const price = Math.max(basePrice + fluctuation, 1); // Ensure price doesn't go below 1

    priceData.push({
      x: new Date(currentDate),
      y: Math.round(price * 100) / 100,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }
  return priceData;
}
/**
 * Fetches the prices of a card from the server.
 * @param {string} cardName - The name of the card.
 * @returns {Promise<Array>} - A promise that resolves to an array of card prices.
 */
async function fetchCardPrices(cardName) {
  const { data } = await axiosInstance.get(`cardinfo.php?name=${encodeURIComponent(cardName)}`);
  const cardPrices = data?.data[0]?.card_prices;
  return cardPrices;
}
/**
 * Handles errors in async functions.
 * @param {function} fn - The async function to be wrapped.
 * @returns {function} - The wrapped function.
 */
function sendJsonResponse(res, status, message, data) {
  res.status(status).json({ message, data });
}
/**
 * Fetches card info from the YGOProDeck API.
 * @param {string} cardName - The ID of the card to fetch.
 * @returns {object} - The card info object.
 * */
const getCardInfo = async (cardName) => {
  try {
    const { data } = await axiosInstance.get(`/cardinfo.php?name=${encodeURIComponent(cardName)}`);
    return data?.data[0];
  } catch (error) {
    logger.error(`Error in function getCardInfo ${cardName}: ${error.message}`);
    throw error;
  }
};
/**
 * Constructs the card data object.
 * @param {object} cardData - The card data object.
 * @param {object} additionalData - The additional data object.
 * @returns {object} - The constructed card data object.
 * */
function constructCardDataObject(cardData, additionalData) {
  const tcgplayerPrice = cardData?.card_prices[0]?.tcgplayer_price || 0;
  const cardSet =
    cardData?.card_sets && cardData?.card_sets.length > 0 ? cardData.card_sets[0] : null;
  const defaultPriceObj = createNewPriceEntry(tcgplayerPrice);

  return {
    image: cardData?.card_images.length > 0 ? cardData.card_images[0].image_url : '',
    quantity: additionalData.quantity || 1,
    price: tcgplayerPrice,
    rarity: cardSet?.set_rarity,
    // create map for rarities
    rarities: cardData?.card_sets?.reduce((acc, set) => {
      acc[set.set_name] = set.set_rarity;
      return acc;
    }, {}),
    sets: cardData?.card_sets?.reduce((acc, set) => {
      acc[set.set_name] = set.set_name;
      return acc;
    }, {}),
    totalPrice: tcgplayerPrice,
    tag: additionalData.tag || '',
    collectionId: additionalData.collectionId,
    collectionModel: additionalData.collectionModel,
    cardModel: additionalData.cardModelName,
    watchList: false,
    card_set: cardSet ? cardSet : {},
    card_sets: cardData?.card_sets,
    card_images: cardData?.card_images,
    card_prices: cardData?.card_prices,
    id: cardData?.id?.toString() || '',
    name: cardData?.name,

    lastSavedPrice: defaultPriceObj,
    latestPrice: defaultPriceObj,
    priceHistory: [],
    dailyPriceHistory: [],
    type: cardData?.type,
    frameType: cardData?.frameType,
    desc: cardData?.desc,
    atk: cardData?.atk,
    def: cardData?.def,
    level: cardData?.level,
    race: cardData?.race,
    attribute: cardData?.attribute,
    ...additionalData.contextualFields, // Merge any additional contextual fields
  };
}
module.exports = {
  getCardInfo,
  constructCardDataObject,
  sendJsonResponse,
  queryBuilder,
  generateFluctuatingPriceData,
  fetchCardPrices,
  axiosInstance,
};
