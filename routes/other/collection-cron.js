const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const axios = require('axios');
const Collection = require('../../models/Collection');
const Deck = require('../../models/Deck');
const colors = require('colors'); // Import the 'colors' library

let isCronJobRunning = false; // Flag to indicate if the cron job is running
const numberOfCronJobRuns = 5;
let cronJobRunCounter = 0;

const instance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

const cardPriceUpdates = {};
// let totalCardPrice = 0; // Initialize the total price variable
let totalDeckPrice = 0; // Initialize the total deck price variable
let totalCollectionPrice = 0; // Initialize the total collection price variable

const cronJob = async () => {
  if (isCronJobRunning) {
    console.log('Cron job is already running, skipping this run.');
    return;
  }

  isCronJobRunning = true; // Set flag to indicate cron job is running

  try {
    cronJobRunCounter++;
    const collections = await Collection.find().populate('cards');
    const decks = await Deck.find().populate('cards');
    const allItems = [...collections, ...decks];

    console.log('Updating card prices...'.blue);
    console.log(('Total items: ' + allItems.length).yellow);

    // let totalCardPrice = 0; // Initialize the total price variable
    // const totalCost = useMemo(() => {
    //   return selectedCollection?.cards.reduce((total, card) => {
    //     return card.card_prices?.[0]?.tcgplayer_price
    //       ? total + parseFloat(card.card_prices[0].tcgplayer_price)
    //       : total;
    //   }, 0);
    // }, [selectedCollection]);

    totalDeckPrice = 0; // Reset before each cron job run
    totalCollectionPrice = 0; // Reset before each cron job run

    for (const item of allItems) {
      const totalPrice = await updateCardsInItem(item);
      item.totalPrice = totalPrice;
      await item.save();

      if (item.constructor.modelName === 'Collection') {
        totalCollectionPrice += totalPrice;
      } else if (item.constructor.modelName === 'Deck') {
        totalDeckPrice += totalPrice;
      }

      console.log('Total collection price: ' + totalCollectionPrice.toFixed(2).blue);
      console.log('Total deck price: ' + totalDeckPrice.toFixed(2).blue);
    }
    console.log('Card prices updated successfully.'.white);

    if (cronJobRunCounter >= numberOfCronJobRuns) {
      console.log(`Cron job completed ${numberOfCronJobRuns} times. Stopping cron job.`);
      cronTask.stop(); // Stop the cron job
    }
    // cronTask.stop();
    isCronJobRunning = false;
  } catch (error) {
    console.error(('Error updating card prices: ' + error).red);
    isCronJobRunning = false; // Reset flag even in case of an error
  }
};

// Schedule the cron job to run every 10 minutes
const cronTask = cron.schedule('*/10 * * * *', cronJob);

// New function to update a specific collection or deck
const updateSpecificItem = async (req, res) => {
  const itemType = req.params.itemType; // 'Deck' or 'Collection'
  const itemId = req.params.itemId;

  try {
    let item;

    if (itemType === 'Collection') {
      item = await Collection.findById(itemId).populate('cards');
    } else if (itemType === 'Deck') {
      item = await Deck.findById(itemId).populate('cards');
    } else {
      return res.status(400).json({ error: 'Invalid item type.' });
    }

    const updatedTotalPrice = await updateCardsInItem(item);
    item.totalPrice = updatedTotalPrice;
    await item.save();

    res.status(200).json({ updatedTotalPrice });
  } catch (error) {
    console.error(`Error updating ${itemType}: ${error}`.red);
    res.status(500).json({ error: `Error updating ${itemType}.` });
  }
};

const updateCardsInItem = async (item) => {
  const itemType = item.constructor.modelName;
  let totalPrice = 0;

  for (const card of item.cards || item.cart.cards) {
    try {
      const cardId = card.id;

      if (!cardId) {
        console.warn(`Card ID missing for ${itemType}: ${card.name}`.yellow);
        continue;
      }

      const response = await instance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
      const cardInfo = response.data.data[0];

      if (!cardInfo) {
        console.warn(`Card info not found for ${itemType} (ID: ${cardId}): ${card.name}`.yellow);
        continue;
      }

      const initialPrices = card.card_prices[0];
      const updatedPrices = {
        tcgplayer_price: cardInfo.card_prices[0]?.tcgplayer_price || 'Price not available',
      };

      const priceDifference = calculatePriceDifference(
        initialPrices.tcgplayer_price,
        updatedPrices.tcgplayer_price,
      );

      if (priceDifference !== 'No change') {
        cardPriceUpdates[cardId] = {
          id: cardId,
          previousPrices: card.card_prices[0],
          updatedPrices,
          priceDifference,
        };
      }

      card.card_prices[0] = updatedPrices;

      const priceMultiplier = item.constructor.modelName === 'Collection' ? 2 : 1; // Double the price for collections

      const updatedPriceValue = parseFloat(updatedPrices.tcgplayer_price);
      if (!isNaN(updatedPriceValue) && updatedPriceValue >= 0) {
        totalPrice += updatedPriceValue * priceMultiplier;
      }

      console.log(
        (`Updated prices for card ${card.name} (ID: ${cardId}) in ${itemType}: ` + updatedPrices)
          .white,
        `Initial prices: ${initialPrices}`.yellow,
        `Price difference: ${priceDifference}`.cyan,
      );
    } catch (error) {
      console.error(('Error updating card prices: ' + error).red);
    }
  }

  return totalPrice;
};

router.get('/update', async (req, res) => {
  try {
    await cronJob();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const changedCards = Object.values(cardPriceUpdates);

    res.status(200).json({
      changedCards,
      totalCardPrice: getTotalCardPrice(),
      totalDeckPrice: totalDeckPrice.toFixed(2),
      totalCollectionPrice: totalCollectionPrice.toFixed(2),
      totalRuns: changedCards.length,
    });
  } catch (error) {
    console.error(('Error starting the cron job: ' + error).red);
    res.status(500).json({ error: 'Error starting the cron job.' });
  }
});

const stopAndResetCronJob = () => {
  if (isCronJobRunning) {
    console.log('Stopping the currently running cron job...');
    cronTask.stop();
    isCronJobRunning = false;
  }
  console.log('Resetting the cron job run counter...');
  cronJobRunCounter = 0;
};

router.get('/stopAndReset', (req, res) => {
  try {
    stopAndResetCronJob();
    res.status(200).json({ message: 'Cron job stopped and counter reset.' });
  } catch (error) {
    console.error(('Error stopping and resetting the cron job: ' + error).red);
    res.status(500).json({ error: 'Error stopping and resetting the cron job.' });
  }
});

router.get('/update/:itemType/:itemId', updateSpecificItem);

function calculatePriceDifference(initialPrice, updatedPrice) {
  if (!initialPrice || !updatedPrice) {
    return 'Price not available';
  }

  const initialPriceValue = parseFloat(initialPrice);
  const updatedPriceValue = parseFloat(updatedPrice);

  if (isNaN(initialPriceValue) || isNaN(updatedPriceValue)) {
    return 'Invalid price format';
  }

  const difference = updatedPriceValue - initialPriceValue;

  if (difference > 0) {
    return `+$${difference.toFixed(2)}`.green;
  } else if (difference < 0) {
    return `-$${Math.abs(difference).toFixed(2)}`.red;
  } else {
    return 'No change';
  }
}

// Schedule the cron job to run every 2 hours
// cron.schedule('*/10 * * * *', cronJob);
// cron.schedule('*/1 * * * *', cronJob);

// Function to start and run the cron job immediately
// const startAndRunCronJob = async () => {
//   await cronJob(); // Run the cron job immediately
// };

// Function to calculate the total card price from cardPriceUpdates
const getTotalCardPrice = () => {
  let totalCardPrice = 0;

  for (const cardId in cardPriceUpdates) {
    const cardUpdate = cardPriceUpdates[cardId];
    const cardPrice = parseFloat(cardUpdate.totalCardPrice);

    if (!isNaN(cardPrice)) {
      totalCardPrice += cardPrice;
    }
  }

  return totalCardPrice.toFixed(2);
};

module.exports = router;
