// const axios = require('axios');
// const {
//   queryBuilder,
//   fetchCardPrices,
//   fetchAndGenerateRandomCardData,
// } = require('./Cards/helpers');
// const User = require('../models/User');
// const logger = require('../configs/winston');
// const { axiosInstance } = require('../utils/utils');
// const cardController = {
//   fetchPriceData: async (cardName) => {
//     const card_prices = await fetchCardPrices(cardName);
//     logger.info('CARD PRICES:', card_prices);
//     return card_prices;
//   },
//   fetchDataForRandomCards: async () => {
//     const cardPromises = [];
//     for (let i = 0; i < 40; i++) {
//       cardPromises.push(fetchAndGenerateRandomCardData());
//     }
//     const cardsData = await Promise.all(cardPromises);
//     return cardsData; // This will be an array of the data for each card fetched and saved
//   },
//   /**
//    * Fetches card data from the API and transforms it into CardInSearch instances.
//    * @param {object} data - The data to be used to fetch and transform the card data.
//    * @returns {array} - The transformed card data.
//    */
//   fetchAndTransformCardData: async (data) => {
//     const response = await axiosInstance.get(
//       `/cardinfo.php?${queryBuilder(data.name, data.race, data.type, data.level, data.attribute)}`,
//     );
//     const fetchedCards = response?.data?.data?.slice(0, 90); // Limiting to 30 cards
//     const cardNames = fetchedCards?.map((card) => card.name);
//     logger.info('FETCHED CARDS', cardNames);
//     const transformedCards = fetchedCards?.map((card) => {
//       const tcgplayerPrice = card?.card_prices[0]?.tcgplayer_price || 0;
//       let card_set = null;
//       if (card?.card_sets && card?.card_sets?.length > 0) {
//         card_set = card?.card_sets[0];
//       }
//       const rarity = card_set?.set_rarity || '';
//       return {
//         image: card?.card_images.length > 0 ? card.card_images[0].image_url : '',
//         quantity: 0,
//         price: tcgplayerPrice || 0,
//         totalPrice: 0,
//         tag: '',
//         collectionId: '',
//         watchList: false,
//         rarity: rarity,
//         card_set: card_set ? card_set : {},
//         chart_datasets: [
//           {
//             x: Date.now(),
//             y: tcgplayerPrice,
//           },
//         ],
//         lastSavedPrice: {
//           num: 0,
//           timestamp: Date.now(),
//         },
//         latestPrice: {
//           num: tcgplayerPrice,
//           timestamp: Date.now(),
//         },
//         priceHistory: [],
//         dailyPriceHistory: [],
//         id: card.id.toString(),
//         name: card.name,
//         type: card.type,
//         frameType: card.frameType,
//         desc: card.desc,
//         atk: card.atk,
//         def: card.def,
//         level: card.level,
//         race: card.race,
//         attribute: card.attribute,
//         archetype: [], // Assuming logic to determine this
//         card_sets: card.card_sets,
//         card_images: card.card_images,
//         card_prices: card.card_prices,
//       };
//     });
//     return transformedCards;
//   },
// };

// module.exports = {
//   cardController,
// };
