const { now } = require('mongoose');
const { fetchCardPrices } = require('../controllers/Cards/helpers');
const { populateUserDataByContext } = require('../controllers/utils/dataUtils');
const { handleError } = require('../middleware/errorHandling/errorHandler');
const { logFunctionSteps } = require('../middleware/loggers/logFunctionSteps');
const { infoLogger } = require('../middleware/loggers/logInfo');
const { handleWarning } = require('../middleware/loggers/logWarning');
const { User, CardInCollection } = require('../models');
const { createDataPoint } = require('../models/schemas/CommonSchemas');
const { formatDate, removeDuplicatePriceHistoryFromCollection } = require('../utils/utils');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const logPriceChangesToFile = (priceChanges) => {
  const filePath = path.join(__dirname, 'priceChangesLog.txt');
  const logMessages = priceChanges.map((change) => `${change.message}\n`).join('');
  // infoLogger('Logging price changes to file...', logMessages);
  fs.appendFile(filePath, logMessages, (err) => {
    if (err) {
      handleError(err, 'Error saving price changes to file:');
    } else {
      infoLogger('Price changes logged to file successfully.');
    }
  });
};
const processCardPriceChange = async (cardData, collectionName, userId) => {
  const userPopulated = await populateUserDataByContext(userId, ['collections']);
  // const collection = userPopulated.allCollections.find(
  //   (coll) => coll._id.toString() === collectionName
  // );
  const card = await CardInCollection.findById(cardData?._id);
  if (!card) {
    handleWarning(`Card not found: ${cardData?._id}`);
    return null;
  }
  // logFunctionSteps(
  //   '3',
  //   `Price:  ${card.price} CurrentLatestPrice:  ${card.latestPrice.num} for card: ${card.name}`,
  // );

  const apiPricesArray = await fetchCardPrices(card.name);
  if (!apiPricesArray) {
    handleWarning(`No price found for card: ${cardData.name}`);
    return null; // Return null to indicate no update needed
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
      let messageCover = '-------------------'.green;
      let message = `Collection: ${collectionName} | Card: ${card.name}, Old Price: ${oldPrice}, New Price: ${newPrice} Difference: ${priceDifference.toFixed(2)}`;
      let fullMessage = `${messageCover} ${message} ${messageCover}`;
      logFunctionSteps('4', message);

      infoLogger(`Price change detected for card: ${card.name}`, fullMessage);
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
      await card.save(); // Assuming card.save() is a valid method to persist changes

      return {
        collectionName,
        cardName: card.name,
        oldPrice,
        newPrice,
        priceDifference,
        message,
      };
    }
  }

  return null;
};
function formatPriceChangeMessage(change) {
  // Format the price change message here based on the change object
  return `[Time: ${formatDate(new Date())}], [Collection: ${change.collectionName}] | [Card: ${change.cardName}, Old Price: ${change.oldPrice}, New Price: ${change.newPrice}] Difference: ${change.priceDifference.toFixed(2)}`;
}
const updatedCollectionCron = async () => {
  try {
    infoLogger('STARTING COLLECTION UPDATE CRON JOB...');
    let globalPriceChanges = []; // To store all changes for logging later

    const users = await User.find({}).select('_id');
    logFunctionSteps('1', `${users.length} users found`);
    for (const user of users) {
      const userPopulated = await populateUserDataByContext(user?._id, ['collections']);
      // if (!userPopulated?.allCollections) {
      //   handleWarning(`No collections found for user ID: ${user._id}`);
      //   continue;
      // }

      for (const collection of userPopulated.allCollections) {
        let collectionPriceChanges = []; // Store changes for this collection
        logFunctionSteps(
          '2',
          `${collection.cards.length} cards found in collection ${collection.name}`,
        );

        for (const card of collection.cards) {
          const priceChange = await processCardPriceChange(
            card,
            collection.name,
            userPopulated?._id,
          );
          if (priceChange) {
            collectionPriceChanges.push(priceChange);
            globalPriceChanges.push(formatPriceChangeMessage(priceChange)); // Format and add to global changes
          }
        }
        collection.cards = removeDuplicatePriceHistoryFromCollection(collection.cards);
        if (collectionPriceChanges.length > 0) {
          collection?.collectionPriceChangeHistory?.push({
            timestamp: new Date(),
            priceChanges: collectionPriceChanges,
          });
          // collection?.collectionPriceChangeHistory?.timestamp = new Date();
          await collection.save();
        } else {
          // Check if over an hour has passed since the last price history update
          const lastUpdate = collection?.collectionPriceHistory?.slice(-1)[0]?.timestamp;
          const now = new Date();
          if (lastUpdate && now - new Date(lastUpdate) > 3600000) {
            collection?.collectionPriceChangeHistory?.push({
              timestamp: now,
              priceChanges: [],
            });
            await collection.save();
            collectionUpdated = true;
          }
        }
      }
    }

    if (globalPriceChanges.length > 0) {
      infoLogger('PRICE CHANGES DETECTED'.green);
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
      infoLogger('No price changes detected.'.red);
    }
  } catch (error) {
    // handleError(error, 'Error in cron job:');
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
