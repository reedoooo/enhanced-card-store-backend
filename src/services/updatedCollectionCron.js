// const { now } = require('mongoose');
const { populateUserDataByContext } = require('../controllers/utils/dataUtils');
const { logFunctionSteps } = require('../middleware/loggers/logFunctionSteps');
const mongoose = require('mongoose');
const { fetchCardPrices } = require('../utils/utils');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const logger = require('../configs/winston');
const { CardInCollection } = require('../models/Card');
const { User } = require('../models/User');
const moment = require('moment-timezone');
const { extendMoment } = require('moment-range');
const { createNewPriceEntry, convertToDataPoints } = require('../utils/dateUtils');
const { differenceInHours } = require('date-fns');
const {
  greenLogBracks,
  redLogBracks,
  yellowLogBracks,
  blueLogBracks,
  orangeLogBracks,
  purpleLogBracks,
  whiteLogBracks,
} = require('../utils/logUtils');
const momentWithRange = extendMoment(moment);
momentWithRange.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
const timezone = 'America/Seattle';
moment.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
const findDocumentById = async (id) => {
  try {
    const document = await CardInCollection.findById(id);
    return document;
  } catch (error) {
    logger.error(`Error fetching document with ID ${id}: ${error}`);
    return null;
  }
};
const logPriceChangesToFile = (priceChanges) => {
  const filePath = path.join(__dirname, 'priceChangesLog.txt');
  const logMessages = priceChanges.map((change) => `${change.message}\n`).join('');
  fs.appendFile(filePath, logMessages, (err) => {
    if (!err) {
      logger.info('Successfully logged price changes to file');
    }
  });
};
const processCardPriceChange = async (cardData, collectionName, username) => {
  if (!mongoose.Types.ObjectId.isValid(cardData?._id)) {
    logger.error(`Invalid ID format: ${cardData?._id}`);
    return null;
  }
  const now = moment().tz(timezone);
  const card = await findDocumentById(cardData._id);
  if (!card) {
    logger.warn(`Card not found: ${cardData?._id}`);
    return null;
  }
  const apiPricesArray = await fetchCardPrices(card.name);
  if (!apiPricesArray || apiPricesArray.length === 0) {
    logger.warn(`No price found for card: ${cardData.name}`);
    return null;
  }
  const currentPrice = parseFloat(card.price);
  const newPrice = parseFloat(apiPricesArray[0]?.tcgplayer_price);
  const differenceDeteced = newPrice !== currentPrice;
  const addedMessage = differenceDeteced ? `[PRICE CHANGE]`.green : `[NO PRICE CHANGE]`.red;
  logger.info(
    `[CHECKING PRICES]` +
      `[` +
      `${username}`.yellow +
      `]` +
      `[` +
      `${collectionName}`.yellow +
      `]` +
      `[${card.name}]` +
      `[CURRENT PRICE: ` +
      `$${currentPrice}`.yellow +
      `]` +
      `[FETCHED PRICE: ` +
      `$${newPrice}`.yellow +
      `]` +
      addedMessage,
  );
  if (differenceDeteced) {
    let messageCover = '';
    let message = '';
    let fullMessage = '';
    const oldTimestamp = card.latestPrice.timestamp;
    const priceDifference = newPrice - currentPrice;
    if (Math.abs(priceDifference) > 0.02) {
      const newDataPoints = convertToDataPoints([card]);
      card?.priceChangeHistory?.push(newDataPoints);
      messageCover = '-------------------'.green;
      message = `Collection: ${collectionName} | Card: ${card.name}, Old Price: ${currentPrice}, New Price: ${newPrice} Difference: ${priceDifference.toFixed(2)}`;
      fullMessage = `${messageCover} ${message} ${messageCover}`;
      logger.info(fullMessage);
      const newPriceEntry = createNewPriceEntry(newPrice);
      card.lastSavedPrice = createNewPriceEntry(currentPrice, oldTimestamp);
      card.latestPrice = newPriceEntry;
      card.price = newPrice;
      card.updatedFromCron = true;
      if (differenceInHours(card.dailyPriceHistory.slice(-1)[0]?.timestamp.getDate(), now) > 24) {
        card.dailyPriceHistory.push(newPriceEntry);
        logger.info(
          `[DAILY PRICE HISTORY UPDATED] ${card.name} [DAILY PRICE HISTORY UPDATED]`.green,
        );
      }
    }
    return {
      changeStatus: true,
      oldPrice: currentPrice,
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
const updatedCollectionCron = async () => {
  logger.info(greenLogBracks('STARTING COLLECTION UPDATE CRON JOB...'));
  let globalPriceChanges = []; // To store all changes for logging later
  const users = await User.find({});
  const now = moment().tz(timezone);
  logFunctionSteps('1', `${users.length} users found`);
  for (const user of users) {
    const userPopulated = await populateUserDataByContext(user?._id, ['collections']);
    for (const collection of userPopulated.allCollections) {
      let collectionPriceChanges = [];
      if (!collection.cards) {
        logger.warn(`No cards found in collection: ${collection.name}`);
        continue;
      }

      for (const card of collection.cards) {
        const { changeStatus, oldPrice, newPrice, priceDifference, message } =
          await processCardPriceChange(card, collection.name, userPopulated?.username);
        if (changeStatus === false) {
          continue;
        }
        if (changeStatus === true) {
          card.price = newPrice;
          await card.save();
          collectionPriceChanges.push({
            timestamp: now,
            difference: priceDifference,
            collectionName: collection.name,
            cardName: card.name,
            oldPrice: oldPrice,
            newPrice: newPrice,
            priceDifference: priceDifference,
            message: message,
          });
          globalPriceChanges.push({
            timestamp: now,
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
      if (collectionPriceChanges.length > 0) {
        const lastUpdate = collection?.collectionPriceChangeHistory?.slice(-1)?.[0]?.timestamp;
        if (lastUpdate && now - new Date(lastUpdate) > 3600000) {
          collection?.collectionPriceChangeHistory?.push({
            timestamp: now,
            priceChanges: [],
          });
          logger.info(
            greenLogBracks('DAILY PRICE HISTORY UPDATED') + greenLogBracks(`${collection.name}`),
          );

          collection.collectionUpdated = true;
        }
        collection?.collectionPriceChangeHistory?.push({
          timestamp: now,
          difference: collectionPriceChanges.reduce((acc, curr) => acc + curr.difference, 0),
          priceChanges: collectionPriceChanges,
        });
        logger.info(`Price change detected for collection: ${collection.name}`.red);
        collection.updatedFromCron = true;
        await collection.save(); // Assuming collection.save() is a valid method to persist changes
      } else {
        logger.info(`No price changes detected for collection: ${collection.name}`.red);
      }
    }
    await user.save();
  }

  if (globalPriceChanges.length > 0) {
    logger.info(greenLogBracks(`[PRICE CHANGES DETECTED] ${globalPriceChanges?.length}`).green);
    logPriceChangesToFile(globalPriceChanges);
  } else {
    logger.info(whiteLogBracks('No price changes detected'.red));
  }
};
exports.updatedCollectionCron = updatedCollectionCron;
