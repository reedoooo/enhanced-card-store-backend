const { fetchCardPrices } = require("../controllers/Cards/helpers");
const { populateUserDataByContext } = require("../controllers/User/dataUtils");
const {
  formatDate,
  removeDuplicatePriceHistoryFromCollection,
} = require("../utils/utils");
const { User } = require("../src/models");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Helper to log price changes to a file
const logPriceChangesToFile = (priceChanges) => {
  const filePath = path.join(__dirname, "priceChangesLog.txt");
  const logMessages = priceChanges
    .map((change) => `${change.message}\n`)
    .join("");
  fs.appendFile(filePath, logMessages, (err) => {
    if (err) {
      console.error("Error saving price changes to file:", err);
    } else {
      console.log("Price changes logged to file successfully.");
    }
  });
};

// Processes price changes for a single card
const processCardPriceChange = async (card, collectionName) => {
  const apiPricesArray = await fetchCardPrices(card.name);
  if (!apiPricesArray) {
    console.warn(`No price fetched for card: ${card.name}`);
    return null; // Return null to indicate no update needed
  }

  const newPrice = apiPricesArray[0]?.tcgplayer_price;
  if (card.latestPrice.num !== newPrice) {
    const oldPrice = card.latestPrice.num;
    const priceDifference = newPrice - oldPrice;

    if (Math.abs(priceDifference) >= 0.01) {
      let message = `Collection: ${collectionName} | Card: ${card.name}, Old Price: ${oldPrice}, New Price: ${newPrice} Difference: ${priceDifference.toFixed(2)}`;
      console.log(message);
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

const updatedCollectionCron = async () => {
  try {
    console.log("STARTING COLLECTION UPDATE CRON JOB...");
    let globalPriceChanges = []; // To store all changes for logging later

    const users = await User.find({}).select("_id");
    for (const userId of users.map((u) => u._id)) {
      const userPopulated = await populateUserDataByContext(userId, [
        "collections",
      ]);
      if (!userPopulated?.allCollections) {
        console.warn(`No collections found for user ID: ${userId}`);
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
        // Remove duplicate price history entries for each card before saving
        collection.cards = removeDuplicatePriceHistoryFromCollection(
          collection.cards
        );

        // Save only if there are changes with a difference of $0.01 or more
        if (collectionPriceChanges.length > 0) {
          collection.priceChangeHistory.push({
            timestamp: new Date(),
            priceChanges: collectionPriceChanges,
          });
          await collection.save();
        } else {
          // Check if over an hour has passed since the last price history update
          const lastUpdate =
            collection.priceChangeHistory.slice(-1)[0]?.timestamp;
          const now = new Date();
          if (lastUpdate && now - new Date(lastUpdate) > 3600000) {
            console
            collection.priceChangeHistory.push({
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
      console.log("No price changes detected.".red);
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
};

exports.updatedCollectionCron = updatedCollectionCron;

function formatPriceChangeMessage(change) {
  // Format the price change message here based on the change object
  return `[Time: ${formatDate(new Date())}], [Collection: ${change.collectionName}] | [Card: ${change.cardName}, Old Price: ${change.oldPrice}, New Price: ${change.newPrice}] Difference: ${change.priceDifference.toFixed(2)}`;
}
