const axios = require('axios');
const colors = require('colors'); // for colorizing logs
const fs = require('fs');
const MonitoredCard = require('../models/MonitoredCard');
const { logError } = require('./loggingUtils');
const { logData } = require('./loggingUtils');
const User = require('../models/User');
const { default: mongoose } = require('mongoose');
const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

const logsDir = './logs';

// Ensure logs directory exists
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
  return new mongoose.Types.ObjectId(userId); // Use 'new' to create an instance of ObjectId
};

// Process Monitored Cards
const trackCardPrices = async (monitoredCards, userId) => {
  monitoredCards = Array.isArray(monitoredCards) ? monitoredCards : [];
  let updates = [];
  // const user = await User?.findById().populate('allCollections');
  try {
    for (const cardData of monitoredCards) {
      const objectId = convertUserIdToObjectId(userId);
      const user = await User.findById(objectId).populate('allCollections');

      if (!user) {
        console.error('User not found.', userId);
        return updates;
      }
      // Check if the card is in any of the user's collections
      const isCardInCollection = user.allCollections.some((collection) =>
        collection.cards.some((c) => c.id === cardData.id),
      );

      if (!isCardInCollection) {
        console.log(`Card ID ${cardData.id} is not in any collection. Skipping.`);
        continue; // Skip this card as it's not in any collection
      }

      let card = await MonitoredCard.findOne({ id: cardData.id });
      const now = new Date();
      let newLatestPrice = 0;
      let quantity = cardData.quantity || 0; // Default to 0 if quantity is not provided

      if (card) {
        const latestCardInfo = await getCardInfo(card.id);
        newLatestPrice = parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || 0);
      } else {
        newLatestPrice = parseFloat(cardData?.latestPrice.num || 0);
      }

      if (isNaN(newLatestPrice)) {
        console.error(`Invalid price for card ID ${cardData.id}: ${newLatestPrice}`);
        continue;
      }

      if (!card) {
        card = new MonitoredCard({
          id: cardData.id,
          name: cardData.name,
          tag: 'monitored',
          latestPrice: { num: newLatestPrice, timestamp: now },
          lastSavedPrice: { num: newLatestPrice, timestamp: now },
          priceHistory: [{ num: newLatestPrice, timestamp: now }],
          quantity: quantity,
        });
        await card.save();
        logData(card); // Log the new card
      } else {
        await updateMonitoredCard(card, newLatestPrice, now); // Pass quantity to the update function
        logData(card); // Log the updated card
      }

      logPriceChange(
        card,
        { latestPrice: card.latestPrice, lastSavedPrice: card.lastSavedPrice, priceDifference: 0 },
        !card,
      );
      updates.push(card);
    }
  } catch (error) {
    console.error(`Error processing monitored card (${monitoredCards}):`, error);
    // console.error(`Error processing monitored card (ID: ${cardData.id}):`, error.message);
    // logError(error, cardData); // Log the error with additional context
    logError(error, error.message, {
      functionName: 'trackCardPrices',
      request: 'trackCardPrices',
      user: 'No user ID provided',
      section: 'error',
      action: 'logs',
      data: monitoredCards,
      debug: {
        /* relevant debug info */
      },
    });
  }

  return updates;
};

const updateMonitoredCard = async (card, newLatestPrice, now) => {
  const oldLatestPrice = card.latestPrice.num;

  if (isNaN(newLatestPrice) || isNaN(oldLatestPrice)) {
    console.error(`Invalid price for card ID ${card.id}`);
    return;
  }

  // Update price history and last saved price only if there's a change
  if (oldLatestPrice !== newLatestPrice) {
    const priceDifference = newLatestPrice - oldLatestPrice;

    // Update the lastSavedPrice with the current latestPrice before changing it
    card.lastSavedPrice = { ...card.latestPrice };

    // Now update the latestPrice
    card.latestPrice = { num: newLatestPrice, timestamp: now };

    // Push the new price to the price history
    card.priceHistory.push({ num: newLatestPrice, timestamp: now });

    await card.save();

    // Log the price change
    logPriceChange(
      card,
      {
        latestPrice: card.latestPrice,
        lastSavedPrice: card.lastSavedPrice,
        priceDifference,
      },
      false,
    );
  }
};

const logPriceChange = (card, latestPriceEntry, isNewCard = false, cardIndex = null) => {
  if (!card || !latestPriceEntry) {
    console.error('[logPriceChange] -----> Invalid data provided for logging.');
    return;
  }

  // logData(card, latestPriceEntry.lastSavedPrice.num);
  // logData(card);
  // Ensure latestPrice and lastSavedPrice are numbers
  const oldPrice = latestPriceEntry.lastSavedPrice.num
    ? Number(latestPriceEntry.lastSavedPrice.num)
    : Number(card.price);
  const newPrice = Number(latestPriceEntry.latestPrice.num);
  if (isNaN(oldPrice) || isNaN(newPrice)) {
    console.error(`Invalid prices for card ID ${card.id}`);
    return;
  }

  const priceDifference = newPrice - oldPrice;
  const significantChangeThreshold = 0.01; // Define a threshold for significant price changes

  const indexPrefix = cardIndex !== null ? `[${cardIndex}] ` : '';
  const tagPrefix = card.tag === 'monitored' ? 'MONITORED' : 'SIMULATED';

  let message;
  if (isNewCard) {
    message = `${indexPrefix}NEW ${tagPrefix} CARD: ${card.name} (ID: ${
      card.id
    }) - Initial Price: $${newPrice.toFixed(2)}`.yellow;
  } else {
    let priceChangeMessage = `${tagPrefix} CARD ${card.name} (ID: ${
      card.id
    }) - Old Price: $${oldPrice.toFixed(2)}, New Price: $${newPrice.toFixed(2)}`;
    if (Math.abs(priceDifference) >= significantChangeThreshold) {
      const priceChangeText =
        priceDifference > 0
          ? ` (Increase by $${priceDifference.toFixed(2)})`.green
          : ` (Decrease by $${priceDifference.toFixed(2)})`.red;
      priceChangeMessage += priceChangeText;
    } else {
      priceChangeMessage += ' (No significant change)'.blue;
    }
    message = indexPrefix + priceChangeMessage;
  }

  console.log(message);
  fs.appendFileSync(`${logsDir}/price-changes.log`, message + '\n');
};

module.exports = {
  trackCardPrices,
  // logPriceChange,
  // updateMonitoredCard,
  // getCardInfo,
};
