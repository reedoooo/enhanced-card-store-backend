// Imports
const express = require('express');
const Collection = require('../../models/Collection');
const Deck = require('../../models/Deck');
const socket = require('../../socket');
const { updateCardsInItem } = require('./itemUpdates');
const { cronTask } = require('./cronJob');

// Constants
const router = express.Router();
const numberOfCronJobRuns = 5; // Ensure to define the number of runs

// State Variables
let totalCollectionPrice = 0;
let totalDeckPrice = 0;
let isCronJobRunning = false;
let cronJobRunCounter = 0;
let allCollectionData = [];
let allDeckData = [];
let allItemTypeData = {};
// let totalPrice = 0;
const processItem = async (item) => {
  allItemTypeData = await updateCardsInItem(item);
  const itemType = item.constructor.modelName;
  await item.save();

  // itemType === 'Collection' ? totalCollectionPrice : totalDeckPrice;
  if (allItemTypeData.allCollectionData.itemType === 'Collection') {
    return allItemTypeData.allCollectionData[allItemTypeData.allCollectionData.length - 1]
      .totalPrice;
  } else if (allItemTypeData.allDeckData.itemType === 'Deck') {
    return allItemTypeData.allDeckData[allItemTypeData.allDeckData.length - 1].totalPrice;
  }
  return 0;
};

const cronJob = async () => {
  if (isCronJobRunning) return;
  isCronJobRunning = true;

  try {
    cronJobRunCounter++;
    const collections = await Collection.find().populate('cards');
    const decks = await Deck.find().populate('cards');
    const allItems = [...collections, ...decks];
    let totalDeckPrice = 0;
    let totalCollectionPrice = 0;

    console.log('Collections', collections);
    console.log('Collections', collections.data);

    console.log('Decks', decks);
    console.log('All Items', allItems);
    for (const item of allItems) {
      const price = await processItem(item);
      if (item.constructor.modelName === 'Collection') {
        totalCollectionPrice += price;
      } else {
        totalDeckPrice += price;
      }
    }

    socket.emit('all-items-updated', { allItemTypeData });

    if (cronJobRunCounter >= numberOfCronJobRuns) {
      cronTask.stop();
    }
    isCronJobRunning = false;
  } catch (error) {
    console.error(error.message);
    isCronJobRunning = false;
  }
};

const runCronJob = async () => {
  await cronJob(); // Assuming you meant to call cronJob
};

const startCron = async (req, res) => {
  cronTask.start();
  res.status(200).json({ message: 'Cron job started successfully.' });
};

const stopCron = async (req, res) => {
  cronTask.stop();
  cronJobRunCounter = 0;
  res.status(200).json({ message: 'Cron job stopped.' });
};

// Exporting
module.exports = { cronJob, runCronJob, isCronJobRunning, startCron, stopCron };
