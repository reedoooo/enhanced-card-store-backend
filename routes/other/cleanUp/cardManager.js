// // const { setUserId } = require('./itemUpdates');
// const { transformedDataSets } = require('./cleanUp/transformedCard');
// const { getCardInfo, validateCardData } = require('../../utils/cardUtils');

// const createNewDataset = (date, newTotalPrice, cardId, priceChanged, cardName, priceChange) => ({
//   x: date,
//   y: newTotalPrice,
//   cardId,
//   priceChanged,
//   cardName,
//   priceChange,
// });

// const updateCardsInItem = async (item, userId, collectionId) => {
//   if (!userId) throw new Error('UserId is missing or invalid at newchart');

//   const itemType = item.constructor.modelName;
//   let totalPrice = 0;
//   const updatedCards = [];
//   let cardPriceUpdates = [];
//   const datasets = [];

//   // setUserId(userId);
//   const cards = Array.isArray(item.cards) ? item.cards : item.cart?.cards || [];
//   console.log('+++++++++++++++++++cards++++++++++++++++++++++++++++++++:', cards);
//   for (const card of cards) {
//     const cardId = card.id;
//     if (!cardId) {
//       console.warn(`Card ID missing for ${itemType}: ${card.name}`);
//       continue;
//     }

//     const cardInfo = await getCardInfo(cardId);
//     if (!cardInfo) {
//       console.warn(`Card info not found for ${itemType} (ID: ${cardId}): ${card.name}`);
//       continue;
//     }

//     const cardPriceUpdate = await updateCardPrice(cards, card, cardInfo, userId, collectionId);
//     if (cardPriceUpdate && 'totalCardPrice' in cardPriceUpdate) {
//       const { totalCardPrice, chartId, chartData, updatedPrices } = cardPriceUpdate;

//       // const chart_datasets = chartData.savedChartData.datasets;
//       // console.log('chartdata.savedchartdata.datasets:', chart_datasets);
//       if (!isNaN(totalCardPrice) && totalCardPrice > 0) {
//         totalPrice += totalCardPrice;

//         datasets.push(
//           createNewDataset(
//             new Date(),
//             totalCardPrice,
//             card._id,
//             card.card_prices[0]?.tcgplayer_price !== cardInfo.card_prices[0]?.tcgplayer_price,
//             cardInfo.name,
//             cardInfo.card_prices[0]?.tcgplayer_price - card.card_prices[0]?.tcgplayer_price,
//           ),
//         );

//         updatedCards.push({ ...cardInfo, ...totalCardPrice });
//         cardPriceUpdates.push({ ...updatedPrices, cardId, chartId, chartData });
//       }
//     }
//   }

//   return {
//     totalPrice,
//     updatedCards,
//     cardPriceUpdates,
//     datasets,
//   };
// };

// const updateCardPrice = async (cards, card, cardInfo, userId, collectionId) => {
//   if (!validateCardData(card) || !validateCardData(cardInfo)) {
//     console.error('Error: Invalid card or cardInfo data provided');
//     return null;
//   }

//   // const chartData = await transformedDataSets(chartDataParams);
//   const chartData = await transformedDataSets(cards, card, cardInfo, userId, collectionId);
//   console.log('+++++++++++++++++++chartData++++++++++++++++++++++++++++++++:', chartData);
//   // const chartDataParams = {
//   //   userId,
//   //   collectionId,
//   //   cardId: card._id,
//   //   cardName: cardInfo.name,
//   //   prices: {
//   //     initial: card.card_prices[0]?.tcgplayer_price,
//   //     updated: cardInfo.card_prices[0]?.tcgplayer_price,
//   //     total: cardInfo.card_prices[0]?.tcgplayer_price * (card?.quantity || 1),
//   //   },
//   //   date: new Date(),
//   //   priceChanged: card.card_prices[0]?.tcgplayer_price !== cardInfo.card_prices[0]?.tcgplayer_price,
//   // };

//   if (!chartData?._id) {
//     console.error('Failed to save chartData. No _id returned:', chartData);
//     return null;
//   }

//   return {
//     updatedPrices: { tcgplayer_price: cardInfo.card_prices[0]?.tcgplayer_price },
//     totalCardPrice: cardInfo.card_prices[0]?.tcgplayer_price * (card?.quantity || 1),
//     chartId: chartData._id,
//     chartData,
//   };
// };

// module.exports = {
//   updateCardsInItem,
//   updateCardPrice,
// };
