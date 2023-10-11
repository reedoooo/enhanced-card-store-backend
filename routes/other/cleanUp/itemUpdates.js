// const User = require('../../models/User');
// const { getIO } = require('../../socket');
// const {
//   getCardInfo,
//   convertUserIdToObjectId,
//   getCardPriceHistory,
//   validateCardData,
// } = require('../../utils/cardUtils');
// const { ensureNumber, roundMoney } = require('../../utils/utils');
// const { ChartData } = require('../../models/ChartData');
// const { transformedDataSets, transformCard } = require('./transformedCard');

// const state = {
//   xyDatasets: [],
//   yUpdateDataset: [],
//   userId: '',
// };

// const setUserId = (userId) => {
//   if (typeof userId === 'string') {
//     state.userId = userId;
//   } else if (typeof userId !== 'string') {
//     const stringUserId = userId.toString();
//     state.userId = stringUserId;
//   } else {
//     console.error('User ID must be a string:', userId);
//   }
// };

// const isDuplicateDataPoint = (dataset, date, cardId) =>
//   dataset.some((data) => data.x.getTime() === date.getTime() && data.cardId === cardId);

// const createNewDataset = (date, newTotalPrice, cardId, priceChanged, cardName, priceChange) => ({
//   x: date,
//   y: newTotalPrice,
//   cardId,
//   priceChanged,
//   cardName,
//   priceChange,
// });

// const calculateTotalY = (xyDatasets) =>
//   xyDatasets.reduce((acc, dataPoint) => acc + (dataPoint?.y || 0), 0);

// const createUpdateDataset = (date, totalY, collectionId) => [
//   {
//     x: date,
//     y: totalY,
//     collectionId,
//   },
// ];

// const generateXYdatasets = async (params) => {
//   try {
//     const {
//       userId = state.userId,
//       collectionId = null,
//       cardId = null,
//       cardName = null,
//       prices: { initial = 0, updated = 0, total = 0 } = {},
//       date = new Date(),
//       priceChanged = false,
//     } = params;

//     const [initialPrice, updatedPrice, totalPrice] = [initial, updated, total]
//       .map(ensureNumber)
//       .map(roundMoney);

//     if ([initialPrice, updatedPrice, totalPrice].includes(NaN)) {
//       console.error(
//         'Price values must be numbers or convertible to numbers:',
//         initialPrice,
//         updatedPrice,
//         totalPrice,
//       );
//       return;
//     }

//     let localXYDatasets = [];

//     if (!isDuplicateDataPoint(state.xyDatasets, date, cardId)) {
//       const newDataset = createNewDataset(
//         date,
//         totalPrice,
//         cardId,
//         priceChanged,
//         cardName,
//         updatedPrice - initialPrice,
//       );
//       state.xyDatasets.push(newDataset);
//       localXYDatasets.push(newDataset);
//     }

//     const totalY = calculateTotalY(state.xyDatasets);
//     state.yUpdateDataset = createUpdateDataset(date, totalY, collectionId);

//     const chartData = await transformedDataSets(state.xyDatasets);

//     if (!chartData || !chartData._id) {
//       console.error('Trying to save chartData without an _id:', chartData);
//       return;
//     }

//     getIO().emit('NEW_CHART', { data: chartData });

//     return localXYDatasets;
//   } catch (error) {
//     console.error('Error in generateXYdatasets:', error);
//   }
// };

// const generateXYdatasetsForCard = async (card, collectionId, userId) => {
//   try {
//     // Use transformCard to get the transformed data for the card
//     const transformedCardData = await transformCard(card, userId, collectionId);
//     console.log('transformedCardData:', transformedCardData);
//     if (!transformedCardData) {
//       console.error('Failed to transform card data for card:', card.cardName);
//       return;
//     }

//     // Push transformed card data to state.xyDatasets
//     state.xyDatasets.push(transformedCardData);

//     const totalY = calculateTotalY(state.xyDatasets);
//     state.yUpdateDataset = createUpdateDataset(new Date(), totalY, collectionId);

//     // Depending on your application logic, you may need to update or save the transformed card data in your database.

//     const chartData = await transformedDataSets(state.xyDatasets);

//     if (!chartData || !chartData._id) {
//       console.error('Trying to save chartData without an _id:', chartData);
//       return;
//     }

//     getIO().emit('NEW_CHART', { data: chartData });
//   } catch (error) {
//     console.error('Error in generateXYdatasetsForCard:', error);
//   }
// };

// const generateXYdatasetsForCollection = async (collection) => {
//   for (const card of collection.cards) {
//     await generateXYdatasetsForCard(card, collection._id, collection.userId);
//   }
// };

// const updateAllUserData = async () => {
//   try {
//     const users = await User.find({});
//     if (!Array.isArray(users)) return;

//     for (const user of users) {
//       await transformedDataSets(user);
//     }
//   } catch (error) {
//     console.error('Failed to update user data:', error);
//   }
// };

// module.exports = {
//   getCardInfo,
//   convertUserIdToObjectId,
//   getCardPriceHistory,
//   validateCardData,
//   setUserId,
//   generateXYdatasets,
//   generateXYdatasetsForCard,
//   generateXYdatasetsForCollection,
//   // updateCardPrice,
//   updateAllUserData,
// };
