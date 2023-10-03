const express = require('express');
const cron = require('node-cron');
const Collection = require('../../models/Collection');
const Deck = require('../../models/Deck');
const { updateCardsInItem, updateCollections } = require('./itemUpdates');
const { getIO } = require('../../socket');
const { ChartData } = require('../../models/ChartData');
const colors = require('colors');
const User = require('../../models/User');
const router = express.Router();
const numberOfCronJobRuns = 5;

// Variables
let isCronJobRunning = false;
let cronJobRunCounter = 0;
let totalCollectionPrice = 0;
let totalDeckPrice = 0;
let allCollectionData = [];
let allDeckData = [];
let allItemTypeData = [];
let allChartData = [];
let allCollectionPrices = [];
let allDeckPrices = [];
let currentItemID = null;
let accumulatedPrice = 0;
let allAccumulatedPrices = [];

// Cron Task Configuration
const cronTask = cron.schedule('*/10 * * * *', async () => {
  if (isCronJobRunning) return;
  isCronJobRunning = true;
  try {
    cronJobRunCounter++;
    console.log('Cron job reached');

    // Assume all users are stored in a User model
    const users = await User.find();
    for (const user of users) {
      console.log('BIG BIG USER', user);
      await updateCollections(user);
    }

    // Call the cronJob function
    // await cronJob();

    if (cronJobRunCounter >= numberOfCronJobRuns) {
      cronTask.stop();
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    isCronJobRunning = false;
  }
});

// const startCronJob = async () => {
//   const io = getIO();
//   console.log('starting cron job');
//   cronTask.start();
//   io.emit('CRON_DATA_SPECIFIC', {
//     data: { numberOfCronJobRuns, cronJobRunCounter, isCronJobRunning },
//   });
// };
const processItem = async (item, userId) => {
  console.log('userId', userId);

  let itemTypeData = await updateCardsInItem(item, userId);
  if (item && typeof item.save === 'function') {
    await item.save(itemTypeData);
  } else {
    console.error('Item is not defined or not a Mongoose model instance');
  }

  if (item.constructor.modelName === 'Collection') {
    totalCollectionPrice += itemTypeData.totalPrice;
    allItemTypeData.push(itemTypeData);
  } else if (item.constructor.modelName === 'Deck') {
    totalDeckPrice += itemTypeData.totalPrice;
    allItemTypeData.push(itemTypeData);
  }
};
// const processItem = async (item) => {
//   // console.log('ITEM', item);
//   let itemTypeData = await updateCardsInItem(item);
//   await item.save(itemTypeData);

//   console.log('itemTypeData', item.totalPrice);

//   // Check for a change in item._id
//   if (currentItemID !== item._id) {
//     if (accumulatedPrice > 0) {
//       // If accumulatedPrice is non-zero, push to allAccumulatedPrices
//       allAccumulatedPrices.push(accumulatedPrice);
//     }
//     // Reset accumulatedPrice and update currentItemID
//     accumulatedPrice = 0;
//     currentItemID = item._id;
//   }

//   // Assuming each card in itemTypeData has a 'price' and 'quantity' property
//   let priceToAdd = itemTypeData.totalPrice || 0;

//   console.log('priceToAdd', priceToAdd);

//   // If item has cards, consider quantity in price calculation
//   if (item.cards && item.cards.length > 0) {
//     priceToAdd = item.cards.reduce((acc, card) => {
//       return acc + (card.card_prices.tcgplayer_price * card.quantity || 1);
//     }, 0);
//     console.log('priceToAdd', priceToAdd);
//   }

//   accumulatedPrice += priceToAdd;
//   console.log('accumulatedPrice', accumulatedPrice);

//   if (item.constructor.modelName === 'Collection') {
//     totalCollectionPrice += priceToAdd;
//     allCollectionPrices.push(priceToAdd);

//     try {
//       item.totalPrice = priceToAdd;
//       await item.save();
//     } catch (err) {
//       console.error(`Failed to save item with id ${item._id}:`, err.message);
//     }

//     return priceToAdd;
//   } else if (item.constructor.modelName === 'Deck') {
//     totalDeckPrice += priceToAdd;
//     allDeckPrices.push(priceToAdd);

//     try {
//       item.totalPrice = priceToAdd;
//       await item.save();
//     } catch (err) {
//       console.error(`Failed to save item with id ${item._id}:`, err.message);
//     }

//     return priceToAdd;
//   } else if (item.constructor.modelName === 'ChartData') {
//     return itemTypeData;
//   }
//   return 0;
// };

const cronJob = async (userId) => {
  const io = getIO();
  if (isCronJobRunning) return;
  isCronJobRunning = true;
  console.log('is cron running', isCronJobRunning);
  console.log('userId', userId);

  try {
    // Resetting stateful variables
    totalCollectionPrice = 0;
    totalDeckPrice = 0;
    allCollectionData = [];
    allDeckData = [];
    allItemTypeData = [];
    allChartData = [];

    cronJobRunCounter++;

    const collections = await Collection.find().populate('cards');
    const decks = await Deck.find().populate('cards');
    const charts = await ChartData.find().populate('datasets');
    // console.log(collections);
    allItemTypeData = [...collections, ...decks];
    allChartData = [...charts];

    for (const item of allItemTypeData) {
      const price = await processItem(item, userId);
      console.log('PRICE--------', price);
      if (item.constructor.modelName === 'Collection') {
        console.log('ITEM TYPE:', item.constructor.modelName);
        totalCollectionPrice = price;
        console.log('totalCollectionPrice', totalCollectionPrice);
      } else {
        totalDeckPrice += price;
        console.log('totalDeckPrice', totalDeckPrice);
      }
    }

    cronTask.start(userId);

    if (cronJobRunCounter >= numberOfCronJobRuns) {
      stopCron();
    }

    isCronJobRunning = false;

    io.emit('ALL_DATA_ITEMS', {
      allItemTypeData,
      cronJobRunCounter,
      allDeckData,
      allCollectionData,
      totalCollectionPrice,
      totalDeckPrice,
    });
  } catch (error) {
    console.error(error.message);
    isCronJobRunning = false;
  }
};

const stopCron = () => {
  cronTask.stop();
  cronJobRunCounter = 0;
};

// Exports
module.exports = {
  cronJob,
  stopCron,
};
