const axios = require('axios');
const colors = require('colors');
const fs = require('fs');
const MonitoredCard = require('../models/MonitoredCard');
const User = require('../models/User');
const mongoose = require('mongoose');
const { logError } = require('./loggingUtils');

const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const getCardInfo = async (cardId) => {
  try {
    const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    return data.data[0];
  } catch (error) {
    console.error(`Error fetching card info for card ID ${cardId}:`, error);
    throw error;
  }
};

const convertUserIdToObjectId = (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }
  return new mongoose.Types.ObjectId(userId);
};

const updateMonitoredCard = async (card, latestPriceInfo) => {
  const now = new Date();
  const oldLatestPrice = card.latestPrice?.num || 0;
  const newLatestPrice = latestPriceInfo.num;

  if (isNaN(newLatestPrice)) {
    console.error(`Invalid price for card ID ${card.id}`);
    return false;
  }

  if (oldLatestPrice !== newLatestPrice) {
    card.lastSavedPrice = { ...card.latestPrice };
    card.latestPrice = { num: newLatestPrice, timestamp: now };
    card.priceHistory.push({ ...latestPriceInfo });
    await card.save();
    return true; // Indicates that the card was updated
  }
  return false;
};

const logPriceChange = (card, isNewCard = false) => {
  if (!card) {
    console.error('[logPriceChange] -----> Invalid card data provided for logging.'.red);
    return;
  }

  const oldPrice = card.lastSavedPrice?.num || 0;
  const newPrice = card.latestPrice.num;
  const priceDifference = newPrice - oldPrice;
  const messagePrefix = isNewCard
    ? `NEW MONITORED CARD: ${card.name} (ID: ${card.id}) - Initial Price: $${newPrice.toFixed(2)}`
        .yellow
    : `MONITORED CARD ${card.name} (ID: ${card.id})`;
  let message = `${card.name} (ID: ${card.id}) price has `;
  message +=
    priceDifference > 0
      ? `increased by $${priceDifference.toFixed(2)}`.green
      : priceDifference < 0
        ? `decreased by $${Math.abs(priceDifference).toFixed(2)}`.red
        : 'no significant change'.blue;

  console.log(messagePrefix + ' - ' + message);
  fs.appendFileSync(`${logsDir}/price-changes.log`, `${new Date().toISOString()} - ${message}\n`);
};

const trackCardPrices = async (monitoredCards, userId) => {
  if (!userId || !Array.isArray(monitoredCards)) {
    console.error('Invalid inputs provided to trackCardPrices.'.red);
    return [];
  }
  // if (!Array.isArray(monitoredCards)) {
  //   console.error('Monitored cards should be an array.'.red);
  // }

  const objectId = convertUserIdToObjectId(userId);
  const user = await User.findById(objectId).populate('allCollections');
  if (!user) {
    console.error(`User not found: ${userId}`.red);
    return [];
  }

  let updates = [];
  for (const cardData of monitoredCards) {
    const collection = user.allCollections.find((c) =>
      c.cards.some((card) => card.id === cardData.id),
    );
    if (!collection) {
      console.log(`Card ID ${cardData.id} is not in any collection. Skipping.`.yellow);
      continue;
    }

    const cardInCollection = collection.cards.find((card) => card.id === cardData.id);
    let card = await MonitoredCard.findOne({ id: cardData.id });
    const latestCardInfo = await getCardInfo(cardData.id);

    if (!card) {
      card = new MonitoredCard({
        id: cardData.id,
        name: cardData.name,
        tag: cardData.tag || 'monitored',
        quantity: cardData.quantity || 0,
      });
      card.latestPrice = {
        num: parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || 0),
        timestamp: new Date(),
      };
      card.lastSavedPrice = { ...card.latestPrice };
      card.priceHistory = [card.latestPrice];
      card.card_images = latestCardInfo.card_images;
      card.card_sets = latestCardInfo.card_sets;
      card.card_prices = latestCardInfo.card_prices;
      await card.save();
      logPriceChange(card, true);
      updates.push({ ...cardInCollection.toObject(), id: card.id });
    } else {
      const isPriceUpdated = await updateMonitoredCard(card, {
        num: parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || 0),
        timestamp: new Date(),
      });
      let cardUpdated = isPriceUpdated;
      if (!card.card_images || !card.card_sets || !card.card_prices) {
        card.card_images = latestCardInfo.card_images;
        card.card_sets = latestCardInfo.card_sets;
        card.card_prices = latestCardInfo.card_prices;
        cardUpdated = true;
      }

      if (cardUpdated) {
        cardInCollection.latestPrice = card.latestPrice;
        cardInCollection.name = card.name;
        cardInCollection.card_images = card.card_images;
        cardInCollection.card_sets = card.card_sets;
        cardInCollection.card_prices = card.card_prices;
        await collection.save();
        updates.push({ ...cardInCollection.toObject(), id: card.id });
      }
    }
  }

  return updates;
};

module.exports = {
  trackCardPrices,
};

// const axios = require('axios');
// const colors = require('colors'); // for colorizing logs
// const fs = require('fs');
// const MonitoredCard = require('../models/MonitoredCard');
// const User = require('../models/User');
// const mongoose = require('mongoose');
// const { logError, logData } = require('./loggingUtils');

// const axiosInstance = axios.create({
//   baseURL: 'https://db.ygoprodeck.com/api/v7/',
// });

// const logsDir = './logs';
// if (!fs.existsSync(logsDir)) {
//   fs.mkdirSync(logsDir);
// }

// const getCardInfo = async (cardId) => {
//   try {
//     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
//     return data.data[0];
//   } catch (error) {
//     console.error(`Error fetching card info for card ID ${cardId}:`, error);
//     throw error;
//   }
// };

// const convertUserIdToObjectId = (userId) => {
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     throw new Error('Invalid user ID');
//   }
//   return new mongoose.Types.ObjectId(userId);
// };

// const updateMonitoredCard = async (card, latestPriceInfo) => {
//   const now = new Date();
//   const oldLatestPrice = card.latestPrice.num;
//   const newLatestPrice = latestPriceInfo.num;

//   if (isNaN(newLatestPrice)) {
//     console.error(`Invalid price for card ID ${card.id}`);
//     return;
//   }

//   if (oldLatestPrice !== newLatestPrice) {
//     card.lastSavedPrice = { ...card.latestPrice };
//     // card.latestPrice = { ...latestPriceInfo };
//     card.latestPrice = { num: newLatestPrice, timestamp: now };
//     card.priceHistory.push({ ...latestPriceInfo });

//     await card.save();
//     logPriceChange(card, false);
//   }
// };
// const logPriceChange = (card, isNewCard = false) => {
//   if (!card) {
//     console.error('[logPriceChange] -----> Invalid card data provided for logging.'.red);
//     return;
//   }

//   const oldPrice = card.lastSavedPrice.num;
//   const newPrice = card.latestPrice.num;
//   const priceDifference = newPrice - oldPrice;
//   const significantChangeThreshold = 0.01;

//   // const initialMessage

//   const indexPrefix = isNewCard ? '[NEW] ' : '';
//   const messagePrefix = isNewCard
//     ? `NEW MONITORED CARD: ${card.name} (ID: ${card.id}) - Initial Price: $${newPrice.toFixed(2)}`
//         .yellow
//     : `MONITORED CARD ${card.name} (ID: ${card.id})`;
//   let message;
//   if (priceDifference !== 0) {
//     let changeText =
//       priceDifference > 0
//         ? `increased by $${priceDifference.toFixed(2)}`.green
//         : `decreased by $${priceDifference.toFixed(2)}`.red;
//     message = `${card.name} (ID: ${card.id}) price has ${changeText}`;
//   } else {
//     message = `${card.name} (ID: ${card.id}) price has no significant change`.blue;
//   }

//   console.log(indexPrefix + messagePrefix + ' - ' + message);
//   // console.log(message);
//   // console.log(messageExtension);
//   fs.appendFileSync(`${logsDir}/price-changes.log`, `${new Date().toISOString()} - ${message}\n`);
// };

// const trackCardPrices = async (monitoredCards, userId) => {
//   if (!Array.isArray(monitoredCards)) {
//     console.error('Monitored cards should be an array.'.red);

//     const error = new Error('Monitored cards should be an array.');
//     logError(error, error.message, {
//       functionName: 'trackCardPrices',
//       request: 'trackCardPrices',
//       user: userId || 'No user ID provided',
//       section: 'error',
//       action: 'logs',
//       data: monitoredCards,
//       debug: {
//         data: monitoredCards,
//         /* relevant debug info */
//       },
//     });
//     return [];
//   }

//   const objectId = convertUserIdToObjectId(userId);
//   const user = await User.findById(objectId).populate('allCollections');
//   if (!user) {
//     console.error(`User not found: ${userId}`.red);
//     return [];
//   }

//   let updates = [];
//   for (const cardData of monitoredCards) {
//     const collection = user.allCollections.find((c) =>
//       c.cards.some((card) => card.id === cardData.id),
//     );
//     if (!collection) {
//       console.log(`Card ID ${cardData.id} is not in any collection. Skipping.`.yellow);
//       continue;
//     }

//     if (!cardInCollection) {
//       console.log(`Card ID ${cardData.id} is not in any collection. Skipping.`.yellow);
//       continue;
//     }
//     const cardInCollection = collection.cards.find((card) => card.id === cardData.id);

//     let card = await MonitoredCard.findOne({ id: cardData.id });
//     // let cardInCollection = await user.allCollections.some((collection) =>
//     //   collection.cards.some((c) => c.id === cardData.id),
//     // );
//     // cards.findOne(( id: cardData.id ) =>
//     //   collection.cards.some((c) => c.id === cardData.id),
//     // );
//     const now = new Date();
//     const latestCardInfo = await getCardInfo(cardData.id);
//     if (!card.card_images || !card.card_sets || !card.card_prices) {
//       // const latestCardInfo = await getCardInfo(cardData.id);
//       card.card_images = latestCardInfo.card_images || card.card_images;
//       card.card_sets = latestCardInfo.card_sets || card.card_sets;
//       card.card_prices = latestCardInfo.card_prices || card.card_prices;
//     }
//     const latestPriceInfo = {
//       num: parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || cardData.latestPrice.num),
//       timestamp: now,
//     };

//     if (!card) {
//       card = new MonitoredCard({
//         id: cardData.id,
//         name: cardData.name,
//         tag: cardData.tag || 'monitored',
//         latestPrice: latestPriceInfo,
//         lastSavedPrice: latestPriceInfo,
//         priceHistory: [latestPriceInfo],
//         quantity: cardData.quantity || 0,
//       });
//       await card.save();
//       logPriceChange(card, true);
//     } else {
//       await updateMonitoredCard(card, latestPriceInfo);
//     }

//     cardInCollection.latestPrice = latestPriceInfo;
//     cardInCollection.name = cardData.name;
//     await collection.save();

//     updates.push(card);
//   }

//   return updates;
// };

// module.exports = {
//   trackCardPrices,
// };

// // const axios = require('axios');
// // const colors = require('colors'); // for colorizing logs
// // const fs = require('fs');
// // const MonitoredCard = require('../models/MonitoredCard');
// // const { logError } = require('./loggingUtils');
// // const { logData } = require('./loggingUtils');
// // const User = require('../models/User');
// // const { default: mongoose } = require('mongoose');
// // const axiosInstance = axios.create({
// //   baseURL: 'https://db.ygoprodeck.com/api/v7/',
// // });

// // const getCardInfo = async (cardId) => {
// //   try {
// //     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
// //     return data.data[0];
// //   } catch (error) {
// //     console.error(`Error fetching card info for card ID ${cardId}:`, error);
// //     throw error;
// //   }
// // };

// // const logsDir = './logs';

// // // Ensure logs directory exists
// // if (!fs.existsSync(logsDir)) {
// //   fs.mkdirSync(logsDir);
// // }

// // const convertUserIdToObjectId = (userId) => {
// //   if (!mongoose.Types.ObjectId.isValid(userId)) {
// //     throw new Error('Invalid user ID');
// //   }
// //   return new mongoose.Types.ObjectId(userId); // Use 'new' to create an instance of ObjectId
// // };

// // // Process Monitored Cards
// // const trackCardPrices = async (monitoredCards, userId) => {
// //   if (!Array.isArray(monitoredCards)) {
// //     console.error('Monitored cards should be an array.'.red);
// //     return [];
// //   }
// //   // monitoredCards = Array.isArray(monitoredCards) ? monitoredCards : [];
// //   const objectId = convertUserIdToObjectId(userId);
// //   const user = await User.findById(objectId).populate('allCollections');
// //   if (!user) {
// //     console.error(`User not found: ${userId}`.red);
// //     return [];
// //   }
// //   let updates = [];

// //   // let updates = [];
// //   // const user = await User?.findById().populate('allCollections');
// //   try {
// //     for (const cardData of monitoredCards) {
// //       // Check if the card is in any of the user's collections
// //       const isCardInCollection = user.allCollections.some((collection) =>
// //         collection.cards.some((c) => c.id === cardData.id),
// //       );

// //       if (!isCardInCollection) {
// //         console.log(`Card ID ${cardData.id} is not in any collection. Skipping.`);
// //         continue; // Skip this card as it's not in any collection
// //       }

// //       let card = await MonitoredCard.findOne({ id: cardData.id });
// //       const now = new Date();
// //       let latestPrice = {
// //         num: cardData?.latestPrice?.num || 0,
// //         timestamp: cardData?.latestPrice?.timestamp || now,
// //       };
// //       let lastSavedPrice = {
// //         num: cardData?.lastSavedPrice?.num || 0,
// //         timestamp: cardData?.lastSavedPrice?.timestamp || now,
// //       };
// //       let priceHistory = cardData?.priceHistory || [];
// //       let quantity = cardData?.quantity || 0; // Default to 0 if quantity is not provided
// //       let tag = cardData?.tag ? cardData.tag : 'monitored';
// //       if (!card) {
// //         // newLatestPrice = parseFloat(cardData?.latestPrice.num || 0);
// //         let newLatestPrice = {
// //           num: parseFloat(cardData?.latestPrice.num || 0),
// //           timestamp: cardData?.latestPrice?.timestamp || now,
// //         };
// //         card = new MonitoredCard({
// //           id: cardData.id,
// //           name: cardData.name,
// //           tag: tag,
// //           latestPrice: newLatestPrice,
// //           lastSavedPrice: lastSavedPrice,
// //           priceHistory: [...cardData.priceHistory, newLatestPrice],
// //           quantity: quantity,
// //         });
// //         await card.save();
// //         logData(card); // Log the new card
// //       }
// //       if (card) {
// //         // Retreive the latest data for the card from the API
// //         const latestCardInfo = await getCardInfo(card.id);
// //         let newLatestPrice = {
// //           num: parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || 0),
// //           timestamp: now,
// //         };
// //         if (isNaN(newLatestPrice.num)) {
// //           console.error(`Invalid price for card ID ${card.id}`);
// //           continue;
// //         }
// //         // if priceHistory is not empty, set the lastSavedPrice and latestPrice
// //         if (
// //           priceHistory.length > 1 &&
// //           newLatestPrice.num !== priceHistory[priceHistory.length - 1]
// //         ) {
// //           latestPrice = priceHistory[priceHistory.length - 1]; // Last price
// //           if (priceHistory[priceHistory.length - 2]) {
// //             lastSavedPrice = priceHistory[priceHistory.length - 2]; // Second last price
// //           }
// //         }
// //         // if priceHistory is empty, set it to the latest price
// //         if (priceHistory.length > 1 && priceHistory[priceHistory.length - 1] === 0) {
// //           lastSavedPrice = priceHistory[priceHistory.length - 2]; // Second last price
// //           latestPrice = priceHistory[priceHistory.length - 1]; // Last price
// //         }
// //         if (!priceHistory || priceHistory.length === 0) {
// //           lastSavedPrice = card.lastSavedPrice;
// //           priceHistory = card.priceHistory;
// //         }
// //         await updateMonitoredCard(card, newLatestPrice, now); // Pass quantity to the update function

// //       }

// //       // Check if the card exists in the database

// //       // if (card) {
// //       //   await updateMonitoredCard(card, newLatestPrice, now); // Pass quantity to the update function
// //       //   logData(card); // Log the updated card
// //       // }

// //       logPriceChange(
// //         card,
// //         { latestPrice: card.latestPrice, lastSavedPrice: card.lastSavedPrice, priceDifference: 0 },
// //         !card,
// //       );

// //       updates.push(card);
// //     }

// //     // console.log('Updates:', updates);
// //     return updates;
// //   } catch (error) {
// //     console.error('Error tracking card prices:', error);
// //     // catch (error) {
// //     //   console.error(`Error processing monitored card (${monitoredCards}):`, error);
// //     //   // console.error(`Error processing monitored card (ID: ${cardData.id}):`, error.message);
// //     //   // logError(error, cardData); // Log the error with additional context
// //     //   logError(error, error.message, {
// //     //     functionName: 'trackCardPrices',
// //     //     request: 'trackCardPrices',
// //     //     user: 'No user ID provided',
// //     //     section: 'error',
// //     //     action: 'logs',
// //     //     data: monitoredCards,
// //     //     debug: {
// //     //       /* relevant debug info */
// //     //     },
// //     //   });
// //     // }
// //     throw error;
// //   }
// // };

// // const updateMonitoredCard = async (card, newLatestPrice, now) => {
// //   const oldLatestPrice = card.latestPrice.num;

// //   if (isNaN(newLatestPrice) || isNaN(oldLatestPrice)) {
// //     console.error(`Invalid price for card ID ${card.id}`);
// //     return;
// //   }

// //   // Update price history and last saved price only if there's a change
// //   if (oldLatestPrice !== newLatestPrice) {
// //     const priceDifference = newLatestPrice - oldLatestPrice;

// //     // Update the lastSavedPrice with the current latestPrice before changing it
// //     card.lastSavedPrice = { ...card.latestPrice };

// //     // Now update the latestPrice
// //     card.latestPrice = { num: newLatestPrice, timestamp: now };

// //     // Push the new price to the price history
// //     card.priceHistory.push({ num: newLatestPrice, timestamp: now });

// //     await card.save();

// //     // Log the price change
// //     logPriceChange(
// //       card,
// //       {
// //         latestPrice: card.latestPrice,
// //         lastSavedPrice: card.lastSavedPrice,
// //         priceDifference,
// //       },
// //       false,
// //     );
// //   }
// // };

// // const logPriceChange = (card, latestPriceEntry, isNewCard = false, cardIndex = null) => {
// //   if (!card || !latestPriceEntry) {
// //     console.error('[logPriceChange] -----> Invalid data provided for logging.');
// //     return;
// //   }

// //   // logData(card, latestPriceEntry.lastSavedPrice.num);
// //   // logData(card);
// //   // Ensure latestPrice and lastSavedPrice are numbers
// //   const oldPrice = latestPriceEntry.lastSavedPrice.num
// //     ? Number(latestPriceEntry.lastSavedPrice.num)
// //     : Number(card.price);
// //   const newPrice = Number(latestPriceEntry.latestPrice.num);
// //   if (isNaN(oldPrice) || isNaN(newPrice)) {
// //     console.error(`Invalid prices for card ID ${card.id}`);
// //     return;
// //   }

// //   const priceDifference = newPrice - oldPrice;
// //   const significantChangeThreshold = 0.01; // Define a threshold for significant price changes

// //   const indexPrefix = cardIndex !== null ? `[${cardIndex}] ` : '';
// //   const tagPrefix = card.tag === 'monitored' ? 'MONITORED' : 'SIMULATED';

// //   let message;
// //   if (isNewCard) {
// //     message = `${indexPrefix}NEW ${tagPrefix} CARD: ${card.name} (ID: ${
// //       card.id
// //     }) - Initial Price: $${newPrice.toFixed(2)}`.yellow;
// //   } else {
// //     let priceChangeMessage = `${tagPrefix} CARD ${card.name} (ID: ${
// //       card.id
// //     }) - Old Price: $${oldPrice.toFixed(2)}, New Price: $${newPrice.toFixed(2)}`;
// //     if (Math.abs(priceDifference) >= significantChangeThreshold) {
// //       const priceChangeText =
// //         priceDifference > 0
// //           ? ` (Increase by $${priceDifference.toFixed(2)})`.green
// //           : ` (Decrease by $${priceDifference.toFixed(2)})`.red;
// //       priceChangeMessage += priceChangeText;
// //     } else {
// //       priceChangeMessage += ' (No significant change)'.blue;
// //     }
// //     message = indexPrefix + priceChangeMessage;
// //   }

// //   console.log(message);
// //   fs.appendFileSync(`${logsDir}/price-changes.log`, message + '\n');
// // };

// // module.exports = {
// //   trackCardPrices,
// //   // logPriceChange,
// //   // updateMonitoredCard,
// //   // getCardInfo,
// // };
