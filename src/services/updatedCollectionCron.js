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
const { createNewPriceEntry } = require('../utils/dataUtils');
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
const now = momentWithRange().tz(timezone);
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
  const addedMessage = differenceDeteced
    ? `[PRICE CHANGE]`.green
    : `[NO PRICE CHANGE]`.red;
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
    const oldPrice = card.price;
    const oldTimestamp = card.latestPrice.timestamp;
    const priceDifference = newPrice - oldPrice;
    if (Math.abs(priceDifference) >= 0.01) {
      const priceChangeEntry = {
        timestamp: now,
        previousPrice: oldPrice,
        updatedPrice: newPrice,
        priceDifference: priceDifference,
        increased: priceDifference > 0,
        decreasded: priceDifference < 0,
      };
      card?.priceChangeHistory?.push(priceChangeEntry);
      messageCover = '-------------------'.green;
      message = `Collection: ${collectionName} | Card: ${card.name}, Old Price: ${oldPrice}, New Price: ${newPrice} Difference: ${priceDifference.toFixed(2)}`;
      fullMessage = `${messageCover} ${message} ${messageCover}`;
      logger.info(fullMessage);
      const newPriceEntry = createNewPriceEntry(newPrice);
      card.lastSavedPrice = createNewPriceEntry(oldPrice, oldTimestamp);
      card.latestPrice = newPriceEntry;
      card.price = newPrice;
      card.updatedFromCron = true;
      if (differenceInHours(card.dailyPriceHistory.slice(-1)[0]?.timestamp.getDate(), now) > 24) {
        card.dailyPriceHistory.push(newPriceEntry);
        logger.info(
          `[DAILY PRICE HISTORY UPDATED] ${card.name} [DAILY PRICE HISTORY UPDATED]`.green,
        );
      }
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
    // logger.info(`[NO PRICE CHANGE DETECTED] ${card.name} [NO PRICE CHANGE DETECTED]`.red);
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
        // const now = new Date();
        if (lastUpdate && now - new Date(lastUpdate) > 3600000) {
          collection?.collectionPriceChangeHistory?.push({
            timestamp: now,
            priceChanges: [],
          });
          logger.info(
            purpleLogBracks('DAILY PRICE HISTORY UPDATED') + greenLogBracks(`${collection.name}`),
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
  }

  if (globalPriceChanges.length > 0) {
    logger.info(greenLogBracks(`[PRICE CHANGES DETECTED] ${globalPriceChanges?.length}`).green);
    logFunctionSteps(
      '[X]',
      ' | '.green +
        `PRICE CHANGES DETECTED  ${
          globalPriceChanges?.length > 1 ? globalPriceChanges?.length : globalPriceChanges[0]
        }` +
        ' | '.green,
    );
    logPriceChangesToFile(globalPriceChanges);
  } else {
    logger.info(whiteLogBracks('No price changes detected'.red));
  }
};
exports.updatedCollectionCron = updatedCollectionCron;
