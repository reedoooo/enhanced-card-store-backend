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
