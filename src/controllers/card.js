const logger = require('../configs/winston');
const { RandomCard } = require('../models/Card');
const {
  axiosInstance,
  fetchCardPrices,
  queryBuilder,
  generateFluctuatingPriceData,
} = require('../utils/utils');
const moment = require('moment-timezone');
const { extendMoment } = require('moment-range');
const momentWithRange = extendMoment(moment);
momentWithRange.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
const timezone = 'America/Seattle';
moment.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
async function fetchAndGenerateRandomCardData() {
  const endpoint = 'randomcard.php';
  const response = await axiosInstance.get(endpoint);
  const tcgplayerPrice = response?.data?.card_prices[0]?.tcgplayer_price || 0;
  const parsedPrice = parseFloat(tcgplayerPrice) * 10;
  // logger.info(`[FETCHED CARD PRICES][${response?.data?.name}][PRICE: ${parsedPrice}]`);
  const chartData30d = {
    id: '30d',
    name: '30 Days',
    color: '#0000ff',
    data: generateFluctuatingPriceData(30, parsedPrice), // Assuming this function generates your chart data
  };
  let newCardData = {
    image: response?.data?.card_images.length > 0 ? response?.data.card_images[0].image_url : '',
    quantity: 1,
    price: parsedPrice,
    totalPrice: parsedPrice,
    id: response?.data?.id?.toString() || '',
    name: response?.data?.name,
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
  newCardData.averagedChartData['30d'] = chartData30d;
  const newCard = new RandomCard(newCardData);
  await newCard.save();
  return newCard; // Return the saved card data
}
const cardController = {
  fetchPriceData: async (cardName) => {
    const card_prices = await fetchCardPrices(cardName);
    logger.info('CARD PRICES:', card_prices);
    return card_prices;
  },
  fetchDataForRandomCards: async () => {
    try {
      const cardPromises = [];
      for (let i = 0; i < 40; i++) {
        cardPromises.push(await fetchAndGenerateRandomCardData());
      }
      const cardsData = await Promise.all(cardPromises);
      return cardsData; // This will be an array of the data for each card fetched and saved
    } catch (error) {
      logger.error(error);
      throw error;
    }
  },
  /**
   * Fetches card data from the API and transforms it into CardInSearch instances.
   * @param {object} data - The data to be used to fetch and transform the card data.
   * @returns {array} - The transformed card data.
   */
  fetchAndTransformCardData: async (data) => {
    const now = moment().tz(timezone);
    logger.info(`RAW INCOMING DATA: ${data}`);
    const response = await axiosInstance.get(`/cardinfo.php?${queryBuilder(data)}`);
    const fetchedCards = response?.data?.data?.slice(0, 90); // Limiting to 30 cards
    const cardNames = fetchedCards?.map((card) => card.name);
    logger.info('FETCHED CARDS', cardNames);
    const transformedCards = fetchedCards?.map((card) => {
      const tcgplayerPrice = card?.card_prices[0]?.tcgplayer_price || 0;
      const image = card?.card_images.length > 0 ? card.card_images[0].image_url : '';
      let card_set = null;
      if (card?.card_sets && card?.card_sets?.length > 0) {
        card_set = card?.card_sets[0];
      }
      const rarity = card_set?.set_rarity || '';
      return {
        image: image,
        quantity: 0,
        price: tcgplayerPrice || 0,
        totalPrice: 0,
        tag: '',
        collectionId: '',
        watchList: false,
        rarity: rarity,
        card_set: card_set ? card_set : {},
        lastSavedPrice: {
          num: 0,
          timestamp: moment().tz(timezone),
        },
        latestPrice: {
          num: tcgplayerPrice,
          timestamp: moment().tz(timezone),
        },
        priceHistory: [],
        valueHistory: [],
        priceChangeHistory: [],
        dailyPriceHistory: [],
        id: card.id.toString(),
        name: card.name,
        type: card.type,
        frameType: card.frameType,
        desc: card.desc,
        atk: card.atk,
        def: card.def,
        level: card.level,
        race: card.race,
        attribute: card.attribute,
        archetype: [], // Assuming logic to determine this
        card_sets: card.card_sets,
        card_images: card.card_images,
        card_prices: card.card_prices,
      };
    });
    return transformedCards;
  },
};

module.exports = {
  cardController,
};
