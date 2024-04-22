const { now } = require('mongoose');
const { populateUserDataByContext } = require('../controllers/utils/dataUtils');
const { logFunctionSteps } = require('../middleware/loggers/logFunctionSteps');
const { createDataPoint } = require('../models/schemas/CommonSchemas');
const mongoose = require('mongoose');
const {
  formatDate,
  removeDuplicatePriceHistoryFromCollection,
  fetchCardPrices,
} = require('../utils/utils');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const logger = require('../configs/winston');
const { CardInCollection } = require('../models/Card');
const { User } = require('../models/User');
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
};
const findDocumentById = async (id) => {
  try {
    const document = await CardInCollection.findById(id);
    return document;
  } catch (error) {
    logger.error(`Error fetching document with ID ${id}: ${error}`);
    return null;
  }
};
/**
 * Logs the price changes to a file.
 *
 * @param {Array} priceChanges - An array of price changes.
 */
const logPriceChangesToFile = (priceChanges) => {
  const filePath = path.join(__dirname, 'priceChangesLog.txt');
  const logMessages = priceChanges.map((change) => `${change.message}\n`).join('');
  // logger.info('Logging price changes to file...', logMessages);
  fs.appendFile(filePath, logMessages, (err) => {
    if (!err) {
      logger.info('Successfully logged price changes to file');
    }
  });
};
const processCardPriceChange = async (cardData, collectionName, userId) => {
  // if (!isValidObjectId(cardData?._id)) {
  //   logger.warn(`Invalid ObjectId, cardId: ${cardData?._id} of type: ${typeof cardData?._id}`);
  //   return null;
  // }
  // if (!isValidObjectId(userId)) {
  //   logger.error(`Invalid ObjectId, userId: ${userId} of type: ${typeof userId}`);
  //   return null;
  // }
  logger.info(`Processing price change for card: ${cardData?._id}`);

  if (!mongoose.Types.ObjectId.isValid(cardData?._id)) {
    logger.error(`Invalid ID format: ${cardData?._id}`);
    return null;
  }
  const userPopulated = await populateUserDataByContext(userId, ['collections']);
  const card = await findDocumentById(cardData._id);

  // const card = await CardInCollection.findById(cardData?._id);
  if (!card) {
    logger.warn(`Card not found: ${cardData?._id}`);
    return null;
  }
  // logFunctionSteps(
  //   '3',
  //   `Price:  ${card.price} CurrentLatestPrice:  ${card.latestPrice.num} for card: ${card.name}`,
  // );

  const apiPricesArray = await fetchCardPrices(card.name);
  if (!apiPricesArray || apiPricesArray.length === 0) {
    logger.warn(`No price found for card: ${cardData.name}`);
    return null;
  }
  const newPrice = apiPricesArray[0]?.tcgplayer_price;
  const newPrice2 = card.price;
  // logFunctionSteps(
  //   '3',
  //   `Price:  ${newPrice2}` +
  //     ' | '.green +
  //     `CurrentLatestPrice:  ${card.latestPrice.num}` +
  //     ' | '.green +
  //     `NewPrice:  ${newPrice}` +
  //     ' | '.green +
  //     `Difference:  ${newPrice - newPrice2}` +
  //     ' | '.green +
  //     `for card: ${card.name}`,
  // );
  if (card.latestPrice.num !== newPrice) {
    let messageCover = '';

    let message = '';
    let fullMessage = '';
    const oldPrice = card.latestPrice.num;
    const oldTimestamp = card.latestPrice.timestamp;
    const priceDifference = newPrice - oldPrice;
    const priceDifference2 = newPrice2 - oldPrice;
    // logFunctionSteps('3', `Price Difference: ${priceDifference.toFixed(2)} for card: ${card.name} Old Price: ${oldPrice}, New Price: ${newPrice}`);
    if (Math.abs(priceDifference) >= 0.01 || Math.abs(priceDifference2) >= 0.01) {
      const priceChangeEntry = {
        timestamp: new Date(),
        oldPrice,
        newPrice,
        priceDifference,
      };
      card?.priceChangeHistory?.push(priceChangeEntry);
      messageCover = '-------------------'.green;
      message = `Collection: ${collectionName} | Card: ${card.name}, Old Price: ${oldPrice}, New Price: ${newPrice} Difference: ${priceDifference.toFixed(2)}`;
      fullMessage = `${messageCover} ${message} ${messageCover}`;
      logFunctionSteps('4', message);

      logger.info(`Price change detected for card: ${card.name}`, fullMessage);
      card.latestPrice.num = newPrice;
      card.latestPrice.timestamp = new Date();
      card.lastSavedPrice.num = oldPrice;
      card.lastSavedPrice.timestamp = oldTimestamp;
      card.price = newPrice;
      const valueEntry = {
        timestamp: new Date(now),
        num: card.totalPrice,
      }; // Your existing function
      card?.valueHistory?.push(valueEntry);
      card?.nivoValueHistory?.push(
        createDataPoint(valueEntry?.timestamp, valueEntry?.num, 'Data: '),
      );
      const itemDate =
        new Date(card?.dailyPriceHistory[card?.dailyPriceHistory?.length - 1]?.timestamp) ||
        new Date();
      const diffDays = (new Date() - itemDate) / (1000 * 3600 * 24);
      if (diffDays <= 1) {
        card.dailyPriceHistory.push({
          timestamp: new Date(now),
          num: parseFloat(newPrice),
        });
        logFunctionSteps(
          '[1]',
          `Daily Price History Updated for card: ${card.name} with new price: ${newPrice} and price difference: ${priceDifference.toFixed(2)}`,
        );
      }
      // logger.info(`Price change detected for card: ${card.name}`);
      await card.save(); // Assuming card.save() is a valid method to persist changes
    }
    return {
      changeStatus: true,
      oldPrice: oldPrice,
      newPrice: newPrice,
      priceDifference: priceDifference,
      message: fullMessage,
    };
  } else {
    return {
      changeStatus: false,
      message: `No price change detected for card: ${card.name}`,
    };
  }
};
function formatPriceChangeMessage(change) {
  // Format the price change message here based on the change object
  return `[Time: ${formatDate(new Date())}], [Collection: ${change.collectionName}] | [Card: ${change.cardName}, Old Price: ${change.oldPrice}, New Price: ${change.newPrice}] Difference: ${change.priceDifference}`;
}
const updatedCollectionCron = async () => {
  logger.info('STARTING COLLECTION UPDATE CRON JOB...');
  let globalPriceChanges = []; // To store all changes for logging later

  const users = await User.find({});
  logFunctionSteps('1', `${users.length} users found`);
  for (const user of users) {
    const userPopulated = await populateUserDataByContext(user?._id, ['collections']);
    for (const collection of userPopulated.allCollections) {
      let collectionPriceChanges = []; // Store changes for this collection
      logFunctionSteps(
        '2',
        `${collection.cards.length} cards found in collection ${collection.name}`,
      );
      if (!collection.cards) {
        logger.warn(`No cards found in collection: ${collection.name}`);
        continue;
      }

      for (const card of collection.cards) {
        const { changeStatus, oldPrice, newPrice, priceDifference, message } =
          await processCardPriceChange(card, collection.name, userPopulated?._id);
        if (changeStatus === false) {
          continue;
        }
        if (changeStatus === true) {
          collectionPriceChanges.push({
            timestamp: new Date(),
            difference: priceDifference,
            collectionName: collection.name,
            cardName: card.name,
            oldPrice: oldPrice,
            newPrice: newPrice,
            priceDifference: priceDifference,
            message: message,
          });
          globalPriceChanges.push({
            timestamp: new Date(),
            difference: priceDifference,
            collectionName: collection.name,
            cardName: card.name,
            oldPrice: oldPrice,
            newPrice: newPrice,
            priceDifference: priceDifference,
            message: message,
          }); // Format and add to global changes
        }
      }
      collection.cards = removeDuplicatePriceHistoryFromCollection(collection.cards);
      if (collectionPriceChanges.length > 0) {
        collection?.collectionPriceChangeHistory?.push({
          timestamp: new Date(),
          difference: collectionPriceChanges.reduce((acc, curr) => acc + curr.difference, 0),
          priceChanges: collectionPriceChanges,
        });
        // collection?.collectionUpdated = true;
        // logger.info(`Price change detected for collection: ${collection.name}`);
        // await collection.save(); // Assuming collection.save() is a valid method to persist changes
      } else {
        // Check if over an hour has passed since the last price history update
        const lastUpdate = collection?.collectionPriceChangeHistory?.slice(-1)?.[0]?.timestamp;
        const now = new Date();
        if (lastUpdate && now - new Date(lastUpdate) > 3600000) {
          collection?.collectionPriceChangeHistory?.push({
            timestamp: now,
            priceChanges: [],
          });
          logger.info(`No price changes detected for collection: ${collection.name}`);
          collection.collectionUpdated = true;
        }
      }
    }
  }

  if (globalPriceChanges.length > 0) {
    logger.info('PRICE CHANGES DETECTED');
    logFunctionSteps(
      '[X]',
      ' | '.green +
        `PRICE CHANGES DETECTED  ${
          globalPriceChanges?.length > 1 ? globalPriceChanges?.length : globalPriceChanges[0]
        }` +
        ' | '.green,
    );
    // logger.info(globalPriceChanges.length);
    logPriceChangesToFile(globalPriceChanges);
  } else {
    logger.info('No price changes detected.'.red);
  }
};
exports.updatedCollectionCron = updatedCollectionCron;
// logFunctionSteps(
//   '3',
//   `Price:  ${newPrice2}` +
//     ' | '.green +
//     `CurrentLatestPrice:  ${card.latestPrice.num}` +
//     ' | '.green +
//     `NewPrice:  ${newPrice}` +
//     ' | '.green +
//     `Difference:  ${newPrice - newPrice2}` +
//     ' | '.green +
//     `for card: ${card.name}`,
// );
