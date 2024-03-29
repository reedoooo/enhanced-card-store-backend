const { fetchCardPrices } = require("../controllers/Cards/helpers");
const { populateUserDataByContext } = require("../controllers/User/dataUtils");
const { handleError } = require("../middleware/errorHandling/errorHandler");
const { infoLogger } = require("../middleware/loggers/logInfo");
const { handleWarning } = require("../middleware/loggers/logWarning");
const { User } = require("../models");
const {
  formatDate,
  removeDuplicatePriceHistoryFromCollection,
} = require("../utils/utils");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const logPriceChangesToFile = (priceChanges) => {
  const filePath = path.join(__dirname, "priceChangesLog.txt");
  const logMessages = priceChanges
    .map((change) => `${change.message}\n`)
    .join("");
  fs.appendFile(filePath, logMessages, (err) => {
    if (err) {
      handleError(err, "Error saving price changes to file:");
    } else {
      infoLogger("Price changes logged to file successfully.");
    }
  });
};

const processCardPriceChange = async (card, collectionName) => {
  const apiPricesArray = await fetchCardPrices(card.name);
  if (!apiPricesArray) {
    handleWarning(`No price fetched for card: ${card.name}`);
    return null; // Return null to indicate no update needed
  }

  const newPrice = apiPricesArray[0]?.tcgplayer_price;
  if (card.latestPrice.num !== newPrice) {
    const oldPrice = card.latestPrice.num;
    const priceDifference = newPrice - oldPrice;

    if (Math.abs(priceDifference) >= 0.01) {
      let message = `Collection: ${collectionName} | Card: ${card.name}, Old Price: ${oldPrice}, New Price: ${newPrice} Difference: ${priceDifference.toFixed(2)}`;
      infoLogger(message);
      card.latestPrice.num = newPrice;
      card.priceHistory.push({ timestamp: new Date(), num: newPrice });
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
    infoLogger("STARTING COLLECTION UPDATE CRON JOB...");
    let globalPriceChanges = []; // To store all changes for logging later

    const users = await User.find({}).select("_id");
    for (const userId of users?.map((u) => u._id)) {
      const userPopulated = await populateUserDataByContext(userId, [
        "collections",
      ]);
      if (!userPopulated?.allCollections) {
        handleWarning(`No collections found for user ID: ${userId}`);
        continue;
      }

      for (const collection of userPopulated.allCollections) {
        let collectionPriceChanges = []; // Store changes for this collection

        for (const card of collection.cards) {
          const priceChange = await processCardPriceChange(
            card,
            collection.name
          );
          if (priceChange) {
            collectionPriceChanges.push(priceChange);
            globalPriceChanges.push(formatPriceChangeMessage(priceChange)); // Format and add to global changes
          }
        }
        collection.cards = removeDuplicatePriceHistoryFromCollection(
          collection.cards
        );
        if (collectionPriceChanges.length > 0) {
          collection.priceChangeHistory.push({
            timestamp: new Date(),
            priceChanges: collectionPriceChanges,
          });
          await collection.save();
        } else {
          // Check if over an hour has passed since the last price history update
          const lastUpdate =
            collection.priceChangeHistory?.slice(-1)[0]?.timestamp;
          const now = new Date();
          if (lastUpdate && now - new Date(lastUpdate) > 3600000) {
            console;
            collection.priceChangeHistory?.push({
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
      logPriceChangesToFile(globalPriceChanges);
    } else {
      infoLogger("No price changes detected.".red);
    }
  } catch (error) {
    handleError(error, "Error in cron job:");
  }
};

exports.updatedCollectionCron = updatedCollectionCron;
