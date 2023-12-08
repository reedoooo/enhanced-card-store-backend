// const axios = require('axios');
// const colors = require('colors');
// const fs = require('fs');
// const MonitoredCard = require('../models/MonitoredCard');
// const User = require('../models/User');
// const mongoose = require('mongoose');
// const { logError, logData } = require('./loggingUtils');
// const { getCardInfo } = require('./utils');

// // const axiosInstance = axios.create({
// //   baseURL: 'https://db.ygoprodeck.com/api/v7/',
// // });

// const logsDir = './logs';
// if (!fs.existsSync(logsDir)) {
//   fs.mkdirSync(logsDir);
// }

// const updateMonitoredCard = async (card, latestPriceInfo) => {
//   try {
//     const now = new Date();
//     const oldLatestPrice = card.latestPrice?.num || 0;
//     const newLatestPrice = latestPriceInfo.num;

//     if (isNaN(newLatestPrice)) {
//       throw new Error(`Invalid price for card ID ${card.id}`);
//     }

//     if (oldLatestPrice !== newLatestPrice) {
//       card.lastSavedPrice = { ...card.latestPrice };
//       card.latestPrice = { num: newLatestPrice, timestamp: now };
//       card.priceHistory.push({ ...latestPriceInfo });
//       await card.save();
//       return true; // Indicates that the card was updated
//     }
//     return false;
//   } catch (error) {
//     logError(error);
//     return false;
//   }
// };

// const logPriceChange = (card, isNewCard = false) => {
//   try {
//     if (!card) {
//       throw new Error('[logPriceChange] -----> Invalid card data provided for logging.');
//     }

//     const oldPrice = card.lastSavedPrice?.num || 0;
//     const newPrice = card.latestPrice.num;
//     const priceDifference = newPrice - oldPrice;
//     const messagePrefix = isNewCard
//       ? `NEW MONITORED CARD: ${card.name} (ID: ${card.id}) - Initial Price: $${newPrice.toFixed(2)}`
//           .yellow
//       : `MONITORED CARD ${card.name} (ID: ${card.id})`;
//     let message = `${card.name} (ID: ${card.id}) price has `;
//     message +=
//       priceDifference > 0
//         ? `increased by $${priceDifference.toFixed(2)}`.green
//         : priceDifference < 0
//           ? `decreased by $${Math.abs(priceDifference).toFixed(2)}`.red
//           : 'no significant change'.blue;

//     logData(messagePrefix + ' - ' + message);
//     fs.appendFileSync(`${logsDir}/price-changes.log`, `${new Date().toISOString()} - ${message}\n`);
//   } catch (error) {
//     logError(error);
//   }
// };

// const trackCardPrices = async (monitoredCards, userId) => {
//   try {
//     const user = await User.findById(userId).populate({
//       path: 'allCollections',
//       populate: { path: 'cards' },
//     });
//     if (!user) {
//       throw new Error(`User not found: ${user?.id}`);
//     }

//     let updates = [];
//     for (const cardData of monitoredCards) {
//       const collection = user.allCollections.find((c) =>
//         c.cards.some((card) => card.id === cardData.id),
//       );
//       if (!collection) {
//         console.log(`Card ID ${cardData.id} is not in any collection. Skipping.`.yellow);
//         continue;
//       }

//       const cardInCollection = collection.cards.find((card) => card.id === cardData.id);
//       let card = await MonitoredCard.findOne({ id: cardData.id });
//       const latestCardInfo = await getCardInfo(cardData.id);

//       if (!card) {
//         card = new MonitoredCard({
//           id: cardData.id,
//           name: cardData.name,
//           tag: cardData.tag || 'monitored',
//           quantity: cardData.quantity || 0,
//         });
//         card.latestPrice = {
//           num: parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || 0),
//           timestamp: new Date(),
//         };
//         card.lastSavedPrice = { ...card.latestPrice };
//         card.priceHistory = [card.latestPrice];
//         card.card_images = latestCardInfo.card_images;
//         card.card_sets = latestCardInfo.card_sets;
//         card.card_prices = latestCardInfo.card_prices;
//         await card.save();
//         logPriceChange(card, true);
//         updates.push({ ...cardInCollection.toObject(), id: card.id });
//       } else {
//         const isPriceUpdated = await updateMonitoredCard(card, {
//           num: parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || 0),
//           timestamp: new Date(),
//         });
//         let cardUpdated = isPriceUpdated;
//         const card = collection.cards[cardIndex];
//         for (const key in update) {
//           card[key] = update[key];
//         }
//         if (cardUpdated) {
//           logPriceChange(card, false);
//           cardInCollection.latestPrice = card.latestPrice;
//           cardInCollection.name = card.name;
//           cardInCollection.card_images = card.card_images;
//           cardInCollection.card_sets = card.card_sets;
//           cardInCollection.card_prices = card.card_prices;
//           await collection.save();
//           updates.push({ ...cardInCollection.toObject(), id: card.id });
//         }
//       }
//     }

//     logData(updates);
//     return updates;
//   } catch (error) {
//     logError(error);
//     return [];
//   }
// };

// module.exports = {
//   trackCardPrices,
// };
