const express = require('express');
const cron = require('node-cron');
const Collection = require('../../models/Collection');
const Deck = require('../../models/Deck');
const { getIO } = require('../../socket');
const { ChartData } = require('../../models/ChartData');
const User = require('../../models/User');
const { updateCardsInItem } = require('./cardManager');
const { updateChartBasedOnCollection } = require('./chartManager');
const { updateCollections } = require('./collectionManager');

// Constants
const numberOfCronJobRuns = 5;

// Stateful Variables
let isCronJobRunning = false;
let cronJobRunCounter = 0;
let totalCollectionPrice = 0;
let totalDeckPrice = 0;
let allCollectionData = [];
let allDeckData = [];
let allItemTypeData = [];
let allChartData = [];

// Cron Task Configuration
const cronTask = cron.schedule('*/5 * * * *', async () => {
  if (isCronJobRunning) return;
  isCronJobRunning = true;

  try {
    cronJobRunCounter++;

    // Update collections
    const users = await User.find();
    for (const user of users) {
      await updateCollections(user);
    }

    // Update charts
    const charts = await ChartData.find({});
    for (const chart of charts) {
      await updateChartBasedOnCollection(chart._id);
    }

    if (cronJobRunCounter >= numberOfCronJobRuns) {
      cronTask.stop();
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    isCronJobRunning = false;
  }
});

// Utility Functions
const processItem = async (item, userId) => {
  const itemTypeData = await updateCardsInItem(item, userId);

  if (item && typeof item.save === 'function') {
    await item.save(itemTypeData);
  } else {
    console.error('Item is not defined or not a Mongoose model instance');
  }

  if (item.constructor.modelName === 'Collection') {
    totalCollectionPrice += itemTypeData.totalPrice;
  } else if (item.constructor.modelName === 'Deck') {
    totalDeckPrice += itemTypeData.totalPrice;
  }
};

const stopCron = () => {
  cronTask.stop();
  cronJobRunCounter = 0;
};

// Main Functions
const cronJob = async (userId) => {
  const io = getIO();

  if (isCronJobRunning) return;

  isCronJobRunning = true;
  cronJobRunCounter++;

  try {
    // Reset stateful variables
    totalCollectionPrice = 0;
    totalDeckPrice = 0;
    allCollectionData = [];
    allDeckData = [];
    allItemTypeData = [];
    allChartData = [];

    // Fetch Data
    const collections = await Collection.find().populate('cards');
    const decks = await Deck.find().populate('cards');
    const charts = await ChartData.find().populate('datasets');

    allItemTypeData = [...collections, ...decks];
    allChartData = [...charts];

    for (const item of allItemTypeData) {
      await processItem(item, userId);
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

// Exports
module.exports = {
  cronJob,
  stopCron,
};
