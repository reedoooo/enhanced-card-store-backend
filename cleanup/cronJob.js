// const { validateInput } = require('../../middleware/errorHandling/validators');
// const User = require('../../models/User');
// const { getIO } = require('../../socket');

// const updateUserCard = (card, pricingData) => {
//   try {
//     if (!card) {
//       console.error('Card is missing.');
//       return undefined;
//     }

//     if (!card.id) {
//       console.error('Card ID is missing.', { card });
//       return card;
//     }

//     const updatedCard = { ...card };
//     const updatedPriceInfo = pricingData?.updatedPrices[card.id];
//     console.log('UPDATED CARD:', updatedCard);
//     console.log('UPDATED PRICE INFO:', updatedPriceInfo);
//     if (updatedPriceInfo) {
//       const newPrice = parseFloat(updatedPriceInfo?.updatedPrice);
//       if (!isNaN(newPrice) && newPrice >= 0) {
//         updatedCard.price = newPrice;
//         updatedCard.totalPrice = newPrice * (card.quantity || 1);
//       } else {
//         console.error(`Invalid price for card ID: ${card.id}`);
//       }
//     } else {
//       console.warn(`No updated price available for card ID: ${card.id}. Keeping original price.`);
//     }

//     return updatedCard;
//   } catch (error) {
//     const errorResponse = new Error(
//       'Failed to update current chart datasets. Please try again later.',
//       500,
//     );
//     throw errorResponse; // Rethrow the error to be caught by the Express error middleware
//     // return undefined;
//   }
// };
// const updateCurrentChartDataSets = (collection) => {
//   try {
//     if (!collection) {
//       console.error('Collection is not provided.');
//       return undefined;
//     }

//     const collectionIdStr = collection._id.toString();
//     const newDataset = {
//       id: collectionIdStr,
//       data: {
//         xy: collection.xy || [],
//       },
//     };

//     if (!collection.currentChartDataSets) {
//       collection.currentChartDataSets = [newDataset];
//     } else {
//       const existingDatasetIndex = collection.currentChartDataSets.findIndex(
//         (ds) => ds.id === collectionIdStr,
//       );
//       if (existingDatasetIndex !== -1) {
//         collection.currentChartDataSets[existingDatasetIndex].data = newDataset.data;
//       } else {
//         collection.currentChartDataSets.push(newDataset);
//       }
//     }
//   } catch (error) {
//     const errorResponse = new Error(
//       'Failed to update current chart datasets. Please try again later.',
//       500,
//     );
//     throw errorResponse; // Rethrow the error to be caught by the Express error middleware
//     // return undefined;
//   }
// };
// const updateUserCollections = async (userId, updatedData) => {
//   const { pricingData, body } = updatedData;

//   const io = getIO();

//   try {
//     validateInput(userId, pricingData);

//     if (Object.keys(pricingData.updatedPrices).length === 0) {
//       console.log('No updated prices. Skipping collection update.');
//       return { message: 'No updated prices. Collection update skipped.' };
//     }

//     const user = await User.findById(userId).populate('allCollections');
//     if (!user) {
//       throw new Error('User not found.', 404);
//     }

//     if (!Array.isArray(user.allCollections)) {
//       throw new Error(
//         'Failed to retrieve user collections or collections are not in the expected format.',
//         500,
//       );
//     }

//     for (const collection of user.allCollections) {
//       if (!Array.isArray(collection.cards)) {
//         console.error('Invalid cards array in collection:', { collectionId: collection._id });
//         continue;
//       }

//       collection.cards = collection.cards.map((card) => updateUserCard(card, pricingData)) || [];

//       const previousDayTotalPrice = collection.previousDayTotalPrice || 0;
//       collection.totalPrice = collection.cards.reduce((acc, card) => acc + (card?.price || 0), 0);
//       collection.dailyPriceChange = (collection.totalPrice - previousDayTotalPrice).toString();
//       collection.updatedAt = new Date();

//       updateCurrentChartDataSets(collection);
//       await collection.save();

//       io.emit('HANDLE_UPDATE_AND_SYNC_COLLECTION', {
//         userId,
//         collectionId: collection._id,
//         body,
//       });
//     }

//     return {
//       message: 'Collections have been updated',
//       collections: user.allCollections,
//     };
//   } catch (error) {
//     const errorResponse = new Error(
//       'Failed to update user collections. Please try again later.',
//       500,
//     );
//     throw errorResponse; // Rethrow the error to be caught by the Express error middleware
//     // return undefined;
//   }
// };

// module.exports = {
//   updateUserCollections,
// };
