const logger = require('../../configs/winston');
const { RandomCard } = require('../../models/Card');
const { axiosInstance } = require('../../utils/utils');
/**k
 * Builds a query string from an object containing query parameters.
 * @param {Object}  - An object containing the query parameters.
 * @returns {string} - A query string containing the parameters.
 */
function queryBuilder(name, race, type, level, attribute, id) {
  logger.info(`[SEARCH QUERY CONTENTS][${(name, race, type, level, attribute, id)}]`);

  const queryParts = [
    name && `fname=${encodeURIComponent(name)}`,
    race && `race=${encodeURIComponent(race)}`,
    type && `type=${encodeURIComponent(type)}`,
    level && `level=${encodeURIComponent(level)}`,
    attribute && `attribute=${encodeURIComponent(attribute)}`,
    id && `id=${encodeURIComponent(id)}`,
  ].filter(Boolean);

  const fullQuery = queryParts.join('&');
  logger.info(`[SEARCH QUERY][${fullQuery}]`);
  return fullQuery;
}
/**
 * Fetches card prices from the YGOPRODeck API.
 * @param {string} cardName - The exact name of the Yu-Gi-Oh! card.
 * @returns {Promise<Object>} - A promise that resolves to an object containing card prices.
 */
async function fetchCardPrices(cardName) {
  const encodedName = encodeURIComponent(cardName);
  const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodedName}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('Card not found');
    }

    return data?.data[0]?.card_prices;
}
function generateFluctuatingPriceData(days, basePrice) {
  const priceData = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    // Simulate some price fluctuation
    const fluctuation = (Math.random() - 0.5) * 10; // Random fluctuation between -5 and 5
    const price = Math.max(basePrice + fluctuation, 1); // Ensure price doesn't go below 1

    priceData.push({
      x: new Date(currentDate),
      y: price,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }
  return priceData;
}
async function fetchAndGenerateRandomCardData() {
  const endpoint = 'randomcard.php';
  const response = await axiosInstance.get(endpoint);
  const tcgplayerPrice = response?.data?.card_prices[0]?.tcgplayer_price || 0;
  const chartData = {
    id: '30d',
    color: '#ff0000',
    data: generateFluctuatingPriceData(31, 100), // Assuming this function generates your chart data
  };
  let newCardData = {
    image: response?.data?.card_images.length > 0 ? response?.data.card_images[0].image_url : '',
    quantity: 1,
    price: tcgplayerPrice,
    totalPrice: tcgplayerPrice,
    id: response?.data?.id?.toString() || '',
    name: response?.data?.name,
    priceHistory: [],
    dailyPriceHistory: [],
    type: response?.data?.type,
    frameType: response?.data?.frameType,
    desc: response?.data?.desc,
    atk: response?.data?.atk,
    def: response?.data?.def,
    level: response?.data?.level,
    race: response?.data?.race,
    attribute: response?.data?.attribute,
    averagedChartData: {},
  };
  newCardData.averagedChartData['30d'] = chartData;
  const newCard = new RandomCard(newCardData);
  await newCard.save();
  return newCard; // Return the saved card data
}

module.exports = {
  queryBuilder,
  fetchCardPrices,
  fetchAndGenerateRandomCardData,
};
