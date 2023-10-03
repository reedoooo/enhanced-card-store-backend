// const express = require('express');
// const Collection = require('../../models/Collection');
// const Deck = require('../../models/Deck');
// const { updateCardsInItem } = require('./itemUpdates');
// const { startCronJob, stopCronJob } = require('./cronJob');
// const { getIO } = require('../../socket');
// const { ChartData } = require('../../models/ChartData');
// const router = express.Router();
// const numberOfCronJobRuns = 5;
// // const io = getIO();
// let totalCollectionPrice = 0;
// let totalDeckPrice = 0;
// let isCronJobRunning = false;
// let cronJobRunCounter = 0;
// let allCollectionData = [];
// let allDeckData = [];
// let allItemTypeData = [];
// let allChartData = [];

// const processItem = async (item) => {
//   let itemTypeData = await updateCardsInItem(item);
//   await item.save();

//   if (item.constructor.modelName === 'Collection') {
//     allCollectionData.push(itemTypeData);
//     return itemTypeData.totalPrice;
//   } else if (item.constructor.modelName === 'Deck') {
//     allDeckData.push(itemTypeData);
//     return itemTypeData.totalPrice;
//   } else if (item.constructor.modelName === 'ChartData') {
//     allChartData.push(itemTypeData);
//     return itemTypeData;
//   }
//   return 0;
// };

// const cronJob = async () => {
//   const io = getIO();
//   if (isCronJobRunning) return;
//   isCronJobRunning = true;
//   console.log('is cron running', isCronJobRunning);
//   try {
//     // Resetting stateful variables
//     totalCollectionPrice = 0;
//     totalDeckPrice = 0;
//     allCollectionData = [];
//     allDeckData = [];
//     allItemTypeData = [];
//     allChartData = [];

//     cronJobRunCounter++;

//     const collections = await Collection.find().populate('cards');
//     const decks = await Deck.find().populate('cards');
//     const charts = await ChartData.find().populate('datasets');
//     allItemTypeData = [...collections, ...decks];
//     allChartData = [...charts];
//     for (const item of allItemTypeData) {
//       const price = await processItem(item);
//       if (item.constructor.modelName === 'Collection') {
//         totalCollectionPrice += price;
//       } else {
//         totalDeckPrice += price;
//       }
//     }

//     if (cronJobRunCounter >= numberOfCronJobRuns) {
//       stopCronJob;
//     }
//     isCronJobRunning = false;

//     io.emit('ALL_DATA_ITEMS', {
//       allItemTypeData,
//       allDeckData,
//       allCollectionData,
//       totalCollectionPrice,
//       totalDeckPrice,
//     });
//   } catch (error) {
//     console.error(error.message);
//     isCronJobRunning = false;
//   }
// };

// const stopCron = async () => {
//   stopCronJob;
//   cronJobRunCounter = 0;
// };

// module.exports = {
//   cronJob,
//   stopCron,
//   startCronJob,
// };
