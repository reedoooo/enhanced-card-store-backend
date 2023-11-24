const { getIO } = require('./socket');
const { handleUpdateAndSync } = require('./controllers/userControllerUtilities');
const { MESSAGES, SOURCES } = require('./constants');
require('colors');
const {
  processCardPriceRequest,
  setupCronJob,
  emitError,
  emitResponse,
} = require('./utils/cronUtils');
const { trackCardPrices } = require('./utils/cronPriceTracking');

// Helper Functions
function handleClientMessage(data, io) {
  try {
    console.log('Received from client:', data);
    io.emit('MESSAGE_TO_CLIENT', { message: 'Client message received', data });
  } catch (error) {
    emitError(io, 'ERROR', error);
  }
}

// Event Handlers
const handleMessageFromClient = (socket, io) => {
  socket.on('MESSAGE_FROM_CLIENT', (data) => handleClientMessage(data, io));
};

const handleCheckCardPrices = (socket, io) => {
  socket.on('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', async (data) => {
    await processCardPriceRequest(data, io);
  });
  setupCronJob(getIO(), trackCardPrices, '*/2 * * * *'); // Tracks card prices every 2 minutes
};

const handleDisconnect = (socket) => {
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
};

const handleGenericEvent = (socket, eventType) => {
  socket.on(eventType, (newData) => {
    if (Array.isArray(newData)) {
      console.log(`[AUTOMATED SERVER MESSAGE] Received data for event ${eventType}:`, newData[0]);
      return;
    }
    console.log(`[AUTOMATED SERVER MESSAGE] Received data for event ${eventType}:`, newData || {});
  });
};

const handleUpdateAndSyncCollectionSocket = (socket, io) => {
  socket.on('HANDLE_UPDATE_AND_SYNC_COLLECTION', async ({ userId, collectionId, body }) => {
    try {
      const result = await handleUpdateAndSync(userId, collectionId, body);
      emitResponse(io, 'COLLECTION_SYNCED', MESSAGES.COLLECTION_SYNCED, result);
    } catch (error) {
      emitError(io, 'ERROR', error, SOURCES.HANDLE_UPDATE_AND_SYNC_COLLECTION_SOCKET);
    }
  });
};

const setupSocketEvents = () => {
  const io = getIO();
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const events = [
      'REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION',
      'REQUEST_PRICES_ACTIVATE_CRON',
      'MESSAGE_FROM_CLIENT',
      'STATUS_UPDATE_REQUEST',
      'STOP_CRON_JOB',
      'HANDLE_UPDATE_USER_DATA',
      'HANDLE_UPDATE_USER_COLLECTION',
      'HANDLE_UPDATE_AND_SYNC_COLLECTION',
      'UPDATED_MONITORED_CARDS',
      'disconnect',
    ];

    events.forEach((eventType) => handleGenericEvent(socket, eventType));
    handleCheckCardPrices(socket, io);
    handleUpdateAndSyncCollectionSocket(socket, io);
    handleMessageFromClient(socket, io);
    handleDisconnect(socket);
  });
};

module.exports = { setupSocketEvents };

// const handleSimulationUpdateRequest = (socket, io) => {
//   socket.on('STATUS_UPDATE_REQUEST', async (data) => {
//     data = data || {};
//     let { message, listOfMonitoredCards = [] } = data;
//     if (listOfMonitoredCards.length === 0) {
//       listOfMonitoredCards = await MonitoredCard.find();
//     }

//     console.log('listOfMonitoredCards:', listOfMonitoredCards);

//     try {
//       const updates = await trackCardPrices(listOfMonitoredCards, []);
//       // logDataInOrganizedFashion(updates);
//       logData(updates);

//       emitResponse(io, 'STATUS_UPDATE_CHARTS', {
//         message: message || 'Simulation update processed',
//         data: {
//           message: 'Updated card prices',
//           data: updates, // Send the updated listOfSimulatedCards
//         },
//       });
//     } catch (error) {
//       console.error('Error on simulation update request:', error);
//       // logData.logError(error);
//       emitError(io, 'ERROR', error);
//     }
//   });

//   cron.schedule('*/2 * * * *', () => {
//     if (!isJobRunning) {
//       cronQueue.push(() => trackCardPrices());
//       executeNextCronJob(io);
//     }
//   });
// };

// const handleSimulationUpdateRequest = (socket, io) => {
//   socket.on('STATUS_UPDATE_REQUEST', async (data) => {
//     data = data || {};
//     let { message, listOfSimulatedCards = [] } = data;
//     if (listOfSimulatedCards.length === 0) {
//       listOfSimulatedCards = await SimulatedCard.find();
//     }

//     try {
//       const updates = await trackCardPrices([], listOfSimulatedCards);
//       // logDataInOrganizedFashion(updates);
//       logData(updates);

//       emitResponse(io, 'STATUS_UPDATE_CHARTS', {
//         message: message || 'Simulation update processed',
//         data: {
//           message: 'Updated card prices',
//           data: updates, // Send the updated listOfSimulatedCards
//         },
//       });
//     } catch (error) {
//       console.error('Error on simulation update request:', error);
//       // logData.logError(error);
//       emitError(io, 'ERROR', error);
//     }
//   });

//   cron.schedule('*/2 * * * *', () => {
//     if (!isJobRunning) {
//       cronQueue.push(() => trackCardPrices());
//       executeNextCronJob(io);
//     }
//   });
// };

// const handleCheckCardPrices = (io, socket) => {
//   // io.on('connection', (socket) => {
//   socket.on('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', async (data) => {
//     logToAllSpecializedLoggers('info', '[0a] handleCheckCardPrices', {
//       section: 'cronjob',
//       action: 'log',
//       data: data,
//     });
//     // const { userId, selectedList } = data;
//     const { selectedList } = data.data;
//     const userId = data.userId;
//     logToAllSpecializedLoggers('info', '[0] handleCheckCardPrices', {
//       section: 'cronjob',
//       action: 'log',
//       data: selectedList,
//     });
//     const jobFunction = async () => {
//       try {
//         const updates = await trackCardPrices(selectedList);
//         emitResponse(io, 'SEND_PRICING_DATA_TO_CLIENT', {
//           message: 'Card prices checked',
//           data: { userId, updates },
//         });
//       } catch (error) {
//         console.error('Error during scheduled card price tracking:', error);
//         emitError(io, 'ERROR', error);
//       }
//     };

//     cron.schedule('*/2 * * * *', () => {
//       cronQueue.push(jobFunction); // Add the job to the queue
//       executeNextCronJob(io); // Attempt to execute the next job in the queue
//     });
//   });
//   // });
// };

// const handleUpdateRequest = async (socket, io) => {
//   socket.on('STATUS_UPDATE_REQUEST', async (payload) => {
//     try {
//       const { message, userId, selectedList } = payload; // Destructuring payload
//       logToAllSpecializedLoggers('verbose', message, {
//         section: 'cronjob',
//         action: 'STATUS_UPDATE_REQUEST',
//         data: selectedList,
//       });

//       // Check if the payload contains all the required data
//       if (!userId || !selectedList) {
//         throw new Error('Invalid payload: userId or selectedList missing.');
//       }

//       await scheduleCheckCardPrices(userId, selectedList);

//       io.emit('STATUS_UPDATE', { message: '[handleUpdateRequest] cron scheduled' });
//       emitResponse(io, 'STATUS_UPDATE_CHARTS', {
//         message: 'Client message received',
//         data: {
//           userId,
//           selectedList,
//         },
//       });
//     } catch (error) {
//       console.error('Error occurred:', error);
//       io.emit('ERROR', {
//         message: 'An error has occurred',
//         error: {
//           detail: error.detail || error.message, // Provide a default error message
//           source: error.source || 'handleUpdateRequest', // Provide a default source
//           errorStack: error.stack,
//         },
//       });
//     }
//   });
// };

// const handleUpdateUserData = (socket, io) => {
//   socket.on('HANDLE_UPDATE_USER_DATA', async ({ userId, pricingData }) => {
//     try {
//       // Acquire lock
//       if (!acquireLock(userId)) {
//         logToAllSpecializedLoggers('error', `Lock acquisition failed for user ${userId}`, {
//           section: 'socket-events',
//           action: 'HANDLE_UPDATE_USER_DATA',
//         });
//         emitResponse(io, 'ERROR', {
//           message: 'User data is currently being updated. Please try again later.',
//         });
//         return;
//       }
//       logToAllSpecializedLoggers('info', 'HANDLE UPDATE USER', {
//         section: 'socket-events',
//         action: 'HANDLE_UPDATE_USER_DATA',
//       });
//       // const cardsArray = Object.values(pricingData.updatedPrices);
//       // const newPricingData = createPricingData(cardsArray);
//       // const updatedUserData = { userId, newPricingData };
//       if (
//         !updatedUserData.newPricingData ||
//         Object.keys(updatedUserData.newPricingData).length === 0
//       ) {
//         throw new CustomError('Failed to update user data', 500, true, {
//           source: 'handleUpdateUserData',
//         });
//       }
//       emitResponse(io, 'USER_DATA_UPDATED', {
//         message: MESSAGES.USER_DATA_UPDATED,
//         data: { updatedUserData },
//       });
//       emitResponse(io, 'INITIATE_UPDATE_USER_COLLECTIONS_SOCKET', {
//         message: MESSAGES.USER_DATA_UPDATED,
//         data: { userId, updatedUserData },
//       });
//     } catch (error) {
//       emitError(
//         io,
//         'ERROR',
//         error instanceof CustomError
//           ? error
//           : new CustomError('Failed to update user data', 500, true, {
//               source: ERROR_SOURCES.HANDLE_UPDATE_USER_DATA,
//               detail: error.message,
//               stack: error.stack,
//             }),
//       );
//     } finally {
//       // Release lock
//       releaseLock(userId);
//     }
//   });
// };

// Function to handle update requests via socket communication

// const handleChartDatasetsCron = (socket, io) => {
//   socket.on('REQUEST_PRICES_ACTIVATE_CRON', async (data) => {
//     try {
//       if (!data || !data.userId) {
//         throw new CustomError('Invalid data received', 400, false, {
//           source: 'handleChartDatasetsCron',
//         });
//       }
//       const { userId, selectedList, allCollections, cardsWithChangedPrice } = data;

//       io.emit('STATUS_UPDATE', {
//         message: '[handleChartDatasetsCron] Cron job started',
//         data: data,
//       });
//       logToAllSpecializedLoggers('info', '[handleChartDatasetsCron] Cron job started', {
//         section: 'cronjob',
//         action: 'log',
//         data: userId,
//       });

//       // Initialize and schedule the cron job
//       const cronJob = cron.schedule('*/10 * * * *', async () => {
//         console.log('Running the card price update job for user:', userId);
//         try {
//           // Call the trackCardPrices function and handle the returned data
//           const updates = await trackCardPrices(
//             selectedList,
//             // allCollections,
//             // cardsWithChangedPrice,
//           );
//           console.log('Card price update complete at', new Date().toString());

//           // Emit the price update with the structured data after tracking
//           // io.emit('CHART_CRON_PRICE_RESPONSE', { userId, updates });
//           // io.emit('CHART_CRON_PRICE_RESPONSE', { message: '[handleChartDatasetsCron]' });

//           emitResponse(io, 'CHART_CRON_PRICE_RESPONSE', {
//             message: MESSAGES.CARD_PRICES_CHECKED,
//             data: {
//               userId,
//               updates,
//             },
//           });
//         } catch (error) {
//           console.error('Error during scheduled card price tracking:', error);
//           // Optionally, stop the cron job if an error occurs
//           cronJob.stop();
//         }
//       });

//       // Start the cron job manually if needed
//       // cronJob.start();
//     } catch (error) {
//       emitError(
//         io,
//         'ERROR',
//         error instanceof CustomError
//           ? error
//           : new CustomError('Failed to start cron job', 500, true, {
//               source: ERROR_SOURCES.HANDLE_CHART_DATASETS_CRON,
//               detail: error.message,
//               stack: error.stack,
//             }),
//       );
//     }
//   });
// };

// const handleClientRequestForPriceCheck = (socket, io) => {
//   socket.on('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', async (data) => {
//     try {
//       const { userId, selectedList } = data.data;
//       logToAllSpecializedLoggers('info', 'CLIENT REQUEST', {
//         section: 'cronjob',
//         action: 'REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION',
//       });

//       emitResponse(io, 'INITIATE_SCHEDULE_CHECK_CARD_PRICES', {
//         message: MESSAGES.CARD_PRICES_CHECKED,
//         data: {
//           userId,
//           selectedList,
//         },
//       });
//     } catch (error) {
//       emitError(
//         io,
//         'ERROR',
//         new CustomError('Failed to initiate card price check', 500, true, {
//           source: ERROR_SOURCES.HANDLE_CLIENT_REQUEST_FOR_PRICE_CHECK,
//           detail: error.message,
//           stack: error.stack,
//         }),
//       );
//     }
//   });
// };

// const handleScheduleCheckCardPrices = (socket, io) => {
//   socket.on('INITIATE_CHECK_CARD_PRICES', async ({ userId, selectedList }) => {
//     try {
//       logToAllSpecializedLoggers('info', 'SCHEDULE CARD PRICE CHECK', {
//         section: 'cronjob',
//         action: 'INITIATE_CHECK_CARD_PRICES',
//       });
//       // await scheduleCheckCardPrices(userId, selectedList);

//       emitResponse(io, 'INITIATE_HANDLE_CHECK_CARD_PRICES', {
//         message: MESSAGES.CARD_PRICES_CHECKED,
//         data: {
//           userId,
//           selectedList,
//         },
//       });
//     } catch (error) {
//       emitError(
//         io,
//         'ERROR',
//         new CustomError('Failed to schedule card price check', 500, true, {
//           source: ERROR_SOURCES.HANDLE_SCHEDULE_CHECK_CARD_PRICES,
//           detail: error.message,
//           stack: error.stack,
//         }),
//       );
//     }
//   });
// };

// const handleCheckCardPrices = (socket, io) => {
//   // socket.on('HANDLE_CHECK_CARD_PRICES', async ({ data }) => {
//   socket.on('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', async (data) => {
//     try {
//       // if (!data || !data.userId) {
//       //   throw new CustomError('Invalid data received', 400, false, {
//       //     source: 'handleChartDatasetsCron',
//       //   });
//       // }
//       const { userId, selectedList } = data;
//       // logToAllSpecializedLoggers('info', 'HANDLE CARD PRICE CHECK', {
//       //   section: 'cronjob',
//       //   action: 'log',
//       // });
//       // io.emit('STATUS_UPDATE', { message: '[handleCheckCardPrices] Cron job started.' });
//       // logToAllSpecializedLoggers('info', 'Cron job started', {
//       //   section: 'cronjob',
//       //   action: 'log',
//       //   data: selectedList,
//       // });

//       const cronJob = cron.schedule('*/10 * * * *', async () => {
//         if (isJobRunning) {
//           console.log('Skipping job: Another job is already running.');
//           return;
//         }
//         isJobRunning = true;
//         console.log('Running the card price update job for user:', data.userId);
//         try {
//           // Call the trackCardPrices function and handle the returned data
//           const updates = await trackCardPrices(
//             selectedList,
//             // allCollections,
//             // cardsWithChangedPrice,
//           );
//           console.log('Card price update complete at', new Date().toString());

//           // Emit the price update with the structured data after tracking
//           // io.emit('SEND_PRICING_DATA_TO_CLIENT', { userId, updates });
//           emitResponse(io, 'SEND_PRICING_DATA_TO_CLIENT', {
//             message: MESSAGES.CARD_PRICES_CHECKED,
//             data: {
//               userId,
//               updates,
//             },
//           });
//         } catch (error) {
//           console.error('Error during scheduled card price tracking:', error);
//           // Optionally, stop the cron job if an error occurs
//           cronJob.stop();
//         }
//       });

//       // Start the cron job manually if needed
//       // cronJob.start();
//     } catch (error) {
//       emitError(
//         io,
//         'ERROR',
//         error instanceof CustomError
//           ? error
//           : new CustomError('Failed to start cron job', 500, true, {
//               source: ERROR_SOURCES.HANDLE_CHART_DATASETS_CRON,
//               detail: error.message,
//               stack: error.stack,
//             }),
//       );
//     } finally {
//       isJobRunning = false;
//     }
//   });
// };

//       // const { pricingData, pricesUpdated, cardsWithChangedPrices } = await checkCardPrices(
//       //   userId,
//       //   selectedList,
//       // );
//       // if (!pricingData) {
//       //   throw new CustomError('Failed to check card prices', 500, true, {
//       //     source: ERROR_SOURCES.HANDLE_CHECK_CARD_PRICES,
//       //   });
//       // }
//       // if (!pricesUpdated) {
//       //   emitResponse(io, 'NO_PRICE_CHANGES', { message: MESSAGES.NO_PRICE_CHANGES });
//       //   return;
//       // }
//       // logToAllSpecializedLoggers('info', 'HANDLE CARD PRICE CHECK', {
//       //   section: 'cronjob',
//       //   action: 'log',
//       //   data: {
//       //     pricingData,
//       //     pricesUpdated,
//       //     cardsWithChangedPrices,
//       //   },
//       // });
//       emitResponse(io, 'SEND_PRICING_DATA_TO_CLIENT', {
//         message: MESSAGES.CARD_PRICES_CHECKED,
//         // data: { pricingData, pricesUpdated, cardsWithChangedPrices },
//       });
//       // emitResponse(io, 'INITIATE_UPDATE_USER_DATA', {
//       //   message: MESSAGES.CARD_PRICES_CHECKED,
//       //   data: { userId, pricingData },
//       // });
//     } catch (error) {
//       emitError(
//         io,
//         'ERROR',
//         error instanceof CustomError
//           ? error
//           : new CustomError('Failed to check card prices', 500, true, {
//               source: ERROR_SOURCES.HANDLE_CHECK_CARD_PRICES,
//               detail: error.message,
//               stack: error.stack,
//             }),
//       );
//     }
//   });
// };
