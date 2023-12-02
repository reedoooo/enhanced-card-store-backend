const axios = require('axios');
const User = require('../models/User');
const Collection = require('../models/Collection'); // Assuming you have a Collection model

const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});
const getSingleCardInfo = async (userId, cardId, cardData) => {
  try {
    //     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    //     const updatedCardInfo = data.data[0];

    const user = await User.findById(userId).populate('allCollections');
    if (!user) throw new Error('User not found');

    user.allCollections.forEach((collection) => {
      const cardIndex = collection.cards.findIndex((card) => card.id === cardId);
      if (cardIndex !== -1) {
        collection.cards[cardIndex] = {
          ...collection.cards[cardIndex],
          ...cardData, // Update with the provided card data
        };
      }
    });

    await Promise.all(user.allCollections.map((collection) => collection.save()));

    return { success: true, message: 'Card updated successfully' };
  } catch (error) {
    console.error(`Error updating card info for card ID ${cardId}:`, error);
    throw error;
  }
};

module.exports = getSingleCardInfo;
// const getSingleCardInfo = async (userId, cardId) => {
//   try {
//     // Fetch latest card information
//     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
//     const updatedCardInfo = data.data[0];

//     // Fetch user and their collections
//     const user = await User.findById(userId).populate('allCollections');
//     if (!user) throw new Error('User not found');

//     // Iterate over all collections to find and update the card
//     user.allCollections.forEach((collection) => {
//       const cardIndex = collection.cards.findIndex((card) => card.id === cardId);
//       if (cardIndex !== -1) {
//         // Update card information
//         const oldCard = collection.cards[cardIndex];
//         const newCard = {
//           ...oldCard,
//           card_images: updatedCardInfo.card_images,
//           card_sets: updatedCardInfo.card_sets,
//           card_prices: updatedCardInfo.card_prices,
//           archetype: updatedCardInfo.archetype,
//           // Add any other properties you need to update
//         };

//         // Replace the old card with the updated one
//         collection.cards[cardIndex] = newCard;
//       }
//     });

//     // Save updated collections
//     await Promise.all(user.allCollections.map((collection) => collection.save()));

//     return { success: true, message: 'Card updated successfully' };
//   } catch (error) {
//     console.error(`Error updating card info for card ID ${cardId}:`, error);
//     throw error;
//   }
// };

// const mongoose = require('mongoose');
// const cron = require('node-cron');
// const axios = require('axios');
// const { CronData } = require('../models/CronData');
// const { getIO } = require('../socket');
// const CustomError = require('../middleware/customError');
// const {
//   loggers,
//   logToAllSpecializedLoggers,
//   logPriceChanges,
// } = require('../middleware/infoLogger');
// const { convertUserIdToObjectId } = require('./utils');
// const User = require('../models/User');

// require('colors');

// const axiosInstance = axios.create({
//   baseURL: 'https://db.ygoprodeck.com/api/v7/',
// });

// const getCardInfo = async (cardId) => {
//   if (!cardId) {
//     throw new CustomError('No card ID provided.', 400);
//   }

//   try {
//     const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
//     return data.data[0];
//   } catch (error) {
//     throw new CustomError('Failed to get card information', 500, true, {
//       function: 'getCardInfo',
//       cardId,
//       error: error.message,
//       stack: error.stack,
//     });
//   }
// };
// const scheduledTasks = new Map();

// const scheduleCheckCardPrices = async (userId, selectedList) => {
//   const io = getIO();

//   try {
//     if (!userId || !Array.isArray(selectedList)) {
//       throw new CustomError('Invalid inputs provided to scheduleCheckCardPrices.', 400);
//     }

//     // cronJobLogger.info('Scheduling cron job for userId:', userId);
//     // cronJobLogger.info('Scheduled tasks:', scheduledTasks);
//     if (scheduledTasks.has(userId)) {
//       io.emit('ERROR', { message: 'A task is already running for this userId.' });
//       return;
//     }

//     const task = cron.schedule(
//       '*/3 * * * *',
//       async () => {
//         try {
//           const { pricesUpdated, cardsWithPriceHistory } = await checkCardPrices(
//             userId,
//             selectedList,
//           );
//           let existingCronData = await CronData.findOne({ userId });

//           if (!existingCronData) {
//             existingCronData = new CronData({ userId, runs: [] });
//           }

//           existingCronData.runs.push({
//             updated: new Date(),
//             valuesUpdated: pricesUpdated,
//             cardsWithPriceHistory: cardsWithPriceHistory,
//           });
//           await existingCronData.save();

//           io.emit('RESPONSE_CRON_DATA', {
//             message: `Cron job updated prices at ${new Date().toLocaleString()}`,
//             existingCronData,
//           });
//         } catch (error) {
//           io.emit('ERROR_MESSAGE', {
//             message: 'Failed to execute scheduled task.',
//             detail: error.message,
//           });
//           console.error('Scheduled Task Error:', error.message, '\nStack:', error.stack);
//         }
//       },
//       { scheduled: false },
//     );

//     task.start();
//     scheduledTasks.set(userId, task);
//     io.emit('RESPONSE_CRON_STARTED', { message: 'Cron job started.', userId });
//     logToAllSpecializedLoggers('info', 'Cron job started', {
//       section: 'cronjob',
//       action: 'log',
//       data: userId,
//     });
//     // cronJobLogger.info('Cron job started for userId:', userId);
//   } catch (error) {
//     // cronJobLogger.error('Failed to schedule cron job:', error.message, error.stack);
//     logToAllSpecializedLoggers('error', 'Failed to schedule cron job:', {
//       section: 'cronjob',
//       action: 'log',
//       data: userId,
//       error,
//     });
//     throw error;
//   }
// };

// const stopCheckCardPrices = (userId) => {
//   if (!userId) {
//     throw new CustomError('No userId provided for stopping the cron job.', 400);
//   }

//   const task = scheduledTasks.get(userId);
//   if (!task) {
//     throw new CustomError('No scheduled task found for this userId.', 404);
//   }

//   task.stop();
//   scheduledTasks.delete(userId);
//   getIO().emit('RESPONSE_CRON_STOPPED', { message: 'Cron job stopped.', userId });
//   logToAllSpecializedLoggers('info', 'Cron job stopped for userId:', {
//     section: 'cronjob',
//     action: 'log',
//     data: userId,
//   });
//   // cronJobLogger.info('Cron job stopped for userId:', userId);
// };

// module.exports = {
//   checkCardPrices,
//   scheduleCheckCardPrices,
//   stopCheckCardPrices,
//   getCardInfo,
//   convertUserIdToObjectId,
// };
