const logger = require('../configs/winston');
const { RandomCard } = require('../models/Card');
const { axiosInstance, fetchCardPrices, queryBuilder, generateFluctuatingPriceData } = require('../utils/utils');
async function fetchAndGenerateRandomCardData() {
  const endpoint = 'randomcard.php';
  const response = await axiosInstance.get(endpoint);
  const tcgplayerPrice = response?.data?.card_prices[0]?.tcgplayer_price || 0;
  const chartData24h = {
    id: '24h',
    color: '#00f00f',
    data: generateFluctuatingPriceData(1, 100), // Assuming this function generates your chart data
  };
  const chartData7d = {
    id: '7d',
    color: '#bb0000',
    data: generateFluctuatingPriceData(8, 100), // Assuming this function generates your chart data
  };
  const chartData30d = {
    id: '30d',
    color: '#0000ff',
    data: generateFluctuatingPriceData(31, 100), // Assuming this function generates your chart data
  };
  const chartData90d = {
    id: '90d',
    color: '#0000ff',
    data: generateFluctuatingPriceData(91, 100), // Assuming this function generates your chart data
  };
  const chartData180d = {
    id: '180d',
    color: '#0000ff',
    data: generateFluctuatingPriceData(181, 100), // Assuming this function generates your chart data
  };
  const chartData270d = {
    id: '270d',
    color: '#0000ff',
    data: generateFluctuatingPriceData(271, 100), // Assuming this function generates your chart data
  };
  const chartData365d = {
    id: '365d',
    color: '#0000ff',
    data: generateFluctuatingPriceData(366, 100), // Assuming this function generates your chart data
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
  newCardData.averagedChartData['24h'] = chartData24h;
  newCardData.averagedChartData['7d'] = chartData7d;
  newCardData.averagedChartData['30d'] = chartData30d;
  newCardData.averagedChartData['90d'] = chartData90d;
  newCardData.averagedChartData['180d'] = chartData180d;
  newCardData.averagedChartData['270d'] = chartData270d;
  newCardData.averagedChartData['365d'] = chartData365d;
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
    const cardPromises = [];
    for (let i = 0; i < 40; i++) {
      cardPromises.push(await fetchAndGenerateRandomCardData());
    }
    const cardsData = await Promise.all(cardPromises);
    return cardsData; // This will be an array of the data for each card fetched and saved
  },
  /**
   * Fetches card data from the API and transforms it into CardInSearch instances.
   * @param {object} data - The data to be used to fetch and transform the card data.
   * @returns {array} - The transformed card data.
   */
  fetchAndTransformCardData: async (data) => {
    // const response = await axiosInstance.get(
    //   `/cardinfo.php?${queryBuilder(data.name, data.race, data.type, data.level, data.attribute)}`,
    // );
    logger.info(`RAW INCOMING DATA: ${data}`);
    const response = await axiosInstance.get(`/cardinfo.php?${queryBuilder(data)}`);
    const fetchedCards = response?.data?.data?.slice(0, 90); // Limiting to 30 cards
    const cardNames = fetchedCards?.map((card) => card.name);
    logger.info('FETCHED CARDS', cardNames);
    const transformedCards = fetchedCards?.map((card) => {
      // const rawData = extractRawTCGPlayerData(card);
      // const initialConstructionData = constructInitialCardData(rawData);
      // return {
      //   ...initialConstructionData,
      //   ...rawData,
      // };
      // const tcgplayerPrice = card?.card_prices[0]?.tcgplayer_price || 0;

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
        chart_datasets: [
          {
            x: Date.now(),
            y: tcgplayerPrice,
          },
        ],
        lastSavedPrice: {
          num: 0,
          timestamp: Date.now(),
        },
        latestPrice: {
          num: tcgplayerPrice,
          timestamp: Date.now(),
        },
        priceHistory: [],
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
