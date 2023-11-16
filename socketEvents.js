const { getIO } = require('./socket');
const { updateUserCollections } = require('./routes/other/cronJob');
const {
  scheduleCheckCardPrices,
  stopCheckCardPrices,
  checkCardPrices,
  createPricingData,
} = require('./utils/cardUtils');
const { handleError } = require('./middleware/handleErrors');
const CustomError = require('./middleware/customError');
const { handleUpdateAndSync } = require('./controllers/userControllerUtilities');
const { MESSAGES, STATUS, ERROR_SOURCES } = require('./constants');
const cron = require('node-cron');
const { loggers, logToAllSpecializedLoggers, logSelectedList } = require('./middleware/infoLogger');
const { trackCardPrices } = require('./utils/cronPriceTracking');
const SimulatedCard = require('./models/SimulatedCard');
require('colors');
const fs = require('fs');
const { logData, logError } = require('./utils/logPriceChanges');

const collectionLocks = {};

const acquireLock = (userId) => {
  if (collectionLocks[userId]) {
    return false;
  }
  collectionLocks[userId] = true;
  return true;
};

const releaseLock = (userId) => {
  delete collectionLocks[userId];
};

function logDataInOrganizedFashion(data) {
  if (!data || !Array.isArray(data)) {
    console.error('[logDataInOrganizedFashion] -----> Invalid data provided for logging.');
    return;
  }

  let logContent = 'Logging Card Data:\n\n';

  data.forEach((card, index) => {
    const latestPrice =
      typeof card.latestPrice === 'object' && card.latestPrice.num
        ? parseFloat(card.latestPrice.num)
        : 0;
    const lastSavedPrice =
      typeof card.lastSavedPrice === 'object' && card.lastSavedPrice.num
        ? parseFloat(card.lastSavedPrice.num)
        : 0;
    const { name, id, tag, status } = card;
    const priceChange = latestPrice - (lastSavedPrice || latestPrice);
    // const priceDifference = latestPrice - lastSavedPrice;
    const priceChangeFormatted = priceChange.toFixed(2);
    const timestamp = new Date().toLocaleString();

    let statusMessage = `Status: ${status}`;
    let priceMessage = `Latest Price: $${latestPrice.toFixed(2)} (Change: ${priceChangeFormatted})`;

    switch (status) {
      case 'increased':
        statusMessage = statusMessage.green;
        priceMessage = priceMessage.green;
        break;
      case 'decreased':
        statusMessage = statusMessage.red;
        priceMessage = priceMessage.red;
        break;
      case 'unchanged':
        statusMessage = statusMessage.yellow;
        priceMessage = priceMessage.yellow;
        break;
      default:
        statusMessage = statusMessage.white;
        priceMessage = priceMessage.white;
    }

    console.log(`[${index}] Name: ${name} (ID: ${id}, Tag: ${tag})`.cyan);
    console.log(`    ${statusMessage}`);
    console.log(`    ${priceMessage}`);
    console.log(`    Logged at: ${timestamp}\n`);

    // For file logging (without color codes)
    logContent += `[${index}] Name: ${name} (ID: ${id}, Tag: ${tag})\n`;
    logContent += `    Status: ${status}\n`;
    logContent += `    Latest Price: $${latestPrice.toFixed(
      2,
    )} (Change: ${priceChangeFormatted})\n`;
    logContent += `    Logged at: ${timestamp}\n\n`;
  });

  // console.log(statusMessage);
  // Append additional data to the message if needed and log it to the file
  fs.appendFileSync('price-changes.log', +logContent + '\n');
}

const emittedResponses = [];
const cronQueue = [];
let responseIndex = 0;
let isJobRunning = false;

const emitResponse = (io, eventType, { message, data, status = STATUS.SUCCESS, error = null }) => {
  // Log only the first 5 items of the data array
  const dataToLog = Array.isArray(data) ? data.slice(0, 5) : data;
  logDataInOrganizedFashion(dataToLog);

  const response = { status, message, data, error };
  io.emit(eventType, response);
  emittedResponses.push({ index: responseIndex, eventType, timestamp: new Date(), response });

  if (!error) {
    status = status || STATUS.SUCCESS;
  } else {
    status = status || STATUS.ERROR;
  }

  logToAllSpecializedLoggers(
    'info',
    `[SOCK]-->[${status}] ${eventType} (Index: ${responseIndex})`,
    { data: { message, data }, section: 'cronjob', action: 'log' },
  );

  responseIndex++;
  // filterOldEventTypes();
  io.emit('EMITTED_RESPONSES', { message: 'YES', data: emittedResponses.slice(-25) });
};

const emitError = (io, errorType, error) => {
  const errorDetails =
    error instanceof CustomError
      ? error
      : new CustomError(error.message || 'An error occurred', 500, true, error);

  logToAllSpecializedLoggers('error', errorDetails.message, {
    section: 'error',
    action: 'logs',
    error: errorDetails,
  });
  logToAllSpecializedLoggers('error', errorDetails.message, {
    section: 'error',
    action: 'file',
    error: errorDetails,
  });
  emitResponse(io, errorType, {
    status: 'ERROR',
    message: 'An error has occurred',
    error: errorDetails,
  });
};

const executeNextCronJob = async (io) => {
  if (cronQueue.length === 0 || isJobRunning) {
    return;
  }

  isJobRunning = true;
  const nextJob = cronQueue.shift(); // Remove the first job from the queue

  try {
    const updates = await nextJob();
    io.emit('STATUS_UPDATE_CRON', {
      message: 'Cron job completed',
      data: updates,
    });
  } catch (error) {
    console.error('Error during scheduled price tracking:', error);
  } finally {
    isJobRunning = false;
    executeNextCronJob(io); // Execute the next job in the queue, if any
  }
};

const filterOldEventTypes = () => {
  const latestResponses = {};
  emittedResponses.forEach((response) => {
    latestResponses[response.eventType] = response.index;
  });

  const filteredResponses = emittedResponses.filter(
    (response) => latestResponses[response.eventType] === response.index,
  );
  emittedResponses.length = 0;
  emittedResponses.push(...filteredResponses);
};

// Event Handlers
const handleMessageFromClient = (socket, io) => {
  socket.on('MESSAGE_FROM_CLIENT', (data) => {
    try {
      console.log('Received from client:', data);
      io.emit('MESSAGE_TO_CLIENT', { message: 'Client message received', data });
    } catch (error) {
      emitError(io, 'ERROR', error);
    }
  });
};

const handleSimulationUpdateRequest = (socket, io) => {
  socket.on('STATUS_UPDATE_REQUEST', async (data) => {
    data = data || {};
    let { message, listOfSimulatedCards = [] } = data;
    if (listOfSimulatedCards.length === 0) {
      listOfSimulatedCards = await SimulatedCard.find();
    }

    try {
      const updates = await trackCardPrices([], listOfSimulatedCards);
      logDataInOrganizedFashion(updates);
      logData(updates, 0);

      emitResponse(io, 'STATUS_UPDATE_CHARTS', {
        message: message || 'Simulation update processed',
        data: {
          message: 'Updated card prices',
          data: updates, // Send the updated listOfSimulatedCards
        },
      });
    } catch (error) {
      console.error('Error on simulation update request:', error);
      // logData.logError(error);
      emitError(io, 'ERROR', error);
    }
  });

  cron.schedule('*/2 * * * *', () => {
    if (!isJobRunning) {
      cronQueue.push(() => trackCardPrices());
      executeNextCronJob(io);
    }
  });
};

const handleCheckCardPrices = (socket, io) => {
  socket.on('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', async (data) => {
    const userId = data.userId;
    const selectedList = data.data.selectedList;
    const monitoredCards = selectedList;
    try {
      const updates = await trackCardPrices(monitoredCards, []);
      logDataInOrganizedFashion(updates);
      logData(updates);

      emitResponse(io, 'SEND_PRICING_DATA_TO_CLIENT', {
        message: 'Card prices checked',
        data: {
          message: userId,
          data: updates,
        },
      });
    } catch (error) {
      console.error('Error during scheduled card price tracking:', error);
      logError(error);
      emitError(io, 'ERROR', error);
    }
  });

  cron.schedule('*/2 * * * *', () => {
    if (!isJobRunning) {
      cronQueue.push(() => trackCardPrices());
      executeNextCronJob(io);
    }
  });
};
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

const handleStopCronJob = (socket, io) => {
  socket.on('STOP_CRON_JOB', async (data) => {
    try {
      if (!data || !data.userId) {
        throw new CustomError('Invalid data received', 400, false, {
          source: 'handleStopCronJob',
        });
      }
      stopCheckCardPrices(data.userId);
    } catch (error) {
      emitError(
        io,
        'ERROR',
        error instanceof CustomError
          ? error
          : new CustomError('Failed to stop cron job', 500, true, {
              source: ERROR_SOURCES.HANDLE_STOP_CRON_JOB,
              detail: error.message,
              stack: error.stack,
            }),
      );
    }
  });
};

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

const handleUpdateUserData = (socket, io) => {
  socket.on('HANDLE_UPDATE_USER_DATA', async ({ userId, pricingData }) => {
    try {
      // Acquire lock
      if (!acquireLock(userId)) {
        logToAllSpecializedLoggers('error', `Lock acquisition failed for user ${userId}`, {
          section: 'socket-events',
          action: 'HANDLE_UPDATE_USER_DATA',
        });
        emitResponse(io, 'ERROR', {
          message: 'User data is currently being updated. Please try again later.',
        });
        return;
      }
      logToAllSpecializedLoggers('info', 'HANDLE UPDATE USER', {
        section: 'socket-events',
        action: 'HANDLE_UPDATE_USER_DATA',
      });
      const cardsArray = Object.values(pricingData.updatedPrices);
      const newPricingData = createPricingData(cardsArray);
      const updatedUserData = { userId, newPricingData };
      if (
        !updatedUserData.newPricingData ||
        Object.keys(updatedUserData.newPricingData).length === 0
      ) {
        throw new CustomError('Failed to update user data', 500, true, {
          source: 'handleUpdateUserData',
        });
      }
      emitResponse(io, 'USER_DATA_UPDATED', {
        message: MESSAGES.USER_DATA_UPDATED,
        data: { updatedUserData },
      });
      emitResponse(io, 'INITIATE_UPDATE_USER_COLLECTIONS_SOCKET', {
        message: MESSAGES.USER_DATA_UPDATED,
        data: { userId, updatedUserData },
      });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        error instanceof CustomError
          ? error
          : new CustomError('Failed to update user data', 500, true, {
              source: ERROR_SOURCES.HANDLE_UPDATE_USER_DATA,
              detail: error.message,
              stack: error.stack,
            }),
      );
    } finally {
      // Release lock
      releaseLock(userId);
    }
  });
};

const handleUpdateUserCollectionsSocket = (socket, io) => {
  socket.on('HANDLE_UPDATE_USER_COLLECTION', async ({ userId, updatedData }) => {
    try {
      logToAllSpecializedLoggers('info', 'HANDLE UPDATE USER COLLECTION', {
        section: 'cronjob',
        action: 'log',
      });
      const result = await updateUserCollections(userId, updatedData);
      if (!result) {
        logToAllSpecializedLoggers('info', 'Update skipped. No updated prices.', {
          section: 'socket-events',
          action: 'HANDLE_UPDATE_USER_COLLECTION',
          data: result,
        });
        emitResponse(io, 'USER_COLLECTION_UPDATE_SKIPPED', {
          message: MESSAGES.NO_PRICE_CHANGES,
        });
        return;
      }

      emitResponse(io, 'SEND_FINAL_UPDATE_TO_CLIENT', {
        message: MESSAGES.USER_COLLECTION_UPDATED,
        data: { userId, updatedData },
      });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        error instanceof CustomError
          ? error
          : new CustomError(MESSAGES.AN_ERROR_OCCURRED, 500, true, {
              source: ERROR_SOURCES.HANDLE_UPDATE_USER_COLLECTIONS_SOCKET,
              detail: error.message,
              stack: error.stack,
            }),
      );
    }
  });
};

const handleUpdateAndSyncCollectionSocket = (socket, io) => {
  socket.on('HANDLE_UPDATE_AND_SYNC_COLLECTION', async ({ userId, collectionId, body }) => {
    try {
      logToAllSpecializedLoggers('info', 'HANDLE UPDATE AND SYNC COLLECTION', {
        section: 'socket-events',
        action: 'HANDLE_UPDATE_AND_SYNC_COLLECTION',
      });
      const result = await handleUpdateAndSync(userId, collectionId, body);
      emitResponse(io, 'COLLECTION_SYNCED', {
        message: MESSAGES.COLLECTION_SYNCED,
        data: result,
      });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        error instanceof CustomError
          ? error
          : new CustomError(
              'An error occurred while updating and syncing collections.',
              500,
              true,
              {
                source: ERROR_SOURCES.HANDLE_UPDATE_AND_SYNC_COLLECTION_SOCKET,
                detail: error.message,
                stack: error.stack,
              },
            ),
      );
    }
  });
};

const handleDisconnect = (socket) => {
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
};

const handleGenericEvent = (socket, eventType) => {
  socket.on(eventType, (newData) => {
    const { userId, data } = newData;
    // logToAllSpecializedLoggers('info', `[X] handleGenericEvent: ${eventType}`, {
    //   section: 'cronjob',
    //   action: 'log',
    //   data: data,
    // });
    if (data?.selectedList) {
      console.log(
        `[AUTOMATED SERVER MESSAGE] Received data for event ${eventType}:`,
        data.selectedList[0],
      );
    } else if (data?.listOfSimulatedCards) {
      console.log(
        `[AUTOMATED SERVER MESSAGE] Received data for event ${eventType}:`,
        data.listOfSimulatedCards,
      );
    } else {
      console.log(`[AUTOMATED SERVER MESSAGE] Received data for event ${eventType}:`, data);
    }
    // socket.emit('EVENT_RESPONSE', {
    //   message: `[AUTOMATED SERVER MESSAGE] Received data for event ${eventType}: ${data}`,
    //   data: data,
    // });
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
      'disconnect',
    ];

    events.forEach((eventType) => {
      handleGenericEvent(socket, eventType);
    });

    handleCheckCardPrices(socket, io);
    handleUpdateUserData(socket, io);
    handleUpdateUserCollectionsSocket(socket, io);
    handleUpdateAndSyncCollectionSocket(socket, io);
    handleDisconnect(socket);
    handleStopCronJob(socket, io);
    handleMessageFromClient(socket, io);
    handleSimulationUpdateRequest(socket, io);

    // If you have other specific event handlers, add them here in a similar manner.
  });
};

module.exports = { setupSocketEvents };

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
