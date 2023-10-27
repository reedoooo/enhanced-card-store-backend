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
require('colors');

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

const emittedResponses = [];
let responseIndex = 0;

const emitResponse = (
  io,
  eventType,
  { status = STATUS.SUCCESS || 'success', message = '', data = {}, error = null },
) => {
  const response = { status, message, data, error };
  io.emit(eventType, response);

  emittedResponses.push({ index: responseIndex, eventType, timestamp: new Date(), response });

  console.log(`[${status.toUpperCase()}] ${eventType} (Index: ${responseIndex}):`, response);

  responseIndex += 1;

  filterOldEventTypes();

  console.log('Emitted responses so far:', emittedResponses[0]);
  io.emit('EMITTED_RESPONSES', emittedResponses);
};

const filterOldEventTypes = () => {
  const latestResponses = {};

  for (let i = emittedResponses.length - 1; i >= 0; i--) {
    const response = emittedResponses[i];
    if (!latestResponses[response.eventType]) {
      latestResponses[response.eventType] = response.index;
    }
  }

  const filteredResponses = emittedResponses.filter(
    (response) => latestResponses[response.eventType] === response.index,
  );

  emittedResponses.length = 0;
  emittedResponses.push(...filteredResponses);
};

// Function to emit errors
const emitError = (io, errorType, error) => {
  if (!(error instanceof CustomError)) {
    error = new CustomError(
      error.message || MESSAGES.AN_ERROR_OCCURRED,
      500,
      true,
      {
        errorType,
        source: error.source || 'Unknown',
        detail: error.detail || null,
        stack: error.stack || null,
      }.red || null,
    );
  }

  const { status, message } = handleError(error, error.context);
  emitResponse(io, errorType, {
    status: STATUS.ERROR || status,
    message,
    error: {
      detail: error.detail,
      source: error.source,
      errorStack: error.stack,
    },
  });
};

const handleMessageFromClient = (socket, io) => {
  socket.on('MESSAGE_FROM_CLIENT', (data) => {
    try {
      console.log('Received from client:', data);
      emitResponse(io, 'MESSAGE_TO_CLIENT', { message: MESSAGES.CLIENT_MESSAGE_RECEIVED });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        new CustomError(MESSAGES.AN_ERROR_OCCURRED, 500, true, {
          source: ERROR_SOURCES.HANDLE_MESSAGE_FROM_CLIENT,
          detail: error.message,
          stack: error.stack,
        }),
      );
    }
  });
};

const handleStopCronJob = (socket, io) => {
  socket.on('STOP_CRON_JOB', async (data) => {
    try {
      if (!data || !data.userId) {
        throw new CustomError('Invalid data received', 400, false, { source: 'handleStopCronJob' });
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

const handleClientRequestForPriceCheck = (socket, io) => {
  socket.on('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', async (data) => {
    try {
      const { userId, selectedList } = data.data;
      console.log('[1][SOCKET EVENTS] CLIENT REQUEST ==========[> ', selectedList[0]);
      // io.emit('INITIATE_SCHEDULE_CHECK_CARD_PRICES', { userId, selectedList });
      emitResponse(io, 'INITIATE_SCHEDULE_CHECK_CARD_PRICES', {
        message: MESSAGES.CARD_PRICES_CHECKED,
        data: {
          userId,
          selectedList,
        },
      });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        new CustomError('Failed to initiate card price check', 500, true, {
          source: ERROR_SOURCES.HANDLE_CLIENT_REQUEST_FOR_PRICE_CHECK,
          detail: error.message,
          stack: error.stack,
        }),
      );
    }
  });
};

const handleScheduleCheckCardPrices = (socket, io) => {
  socket.on('INITIATE_CHECK_CARD_PRICES', async ({ userId, selectedList }) => {
    try {
      console.log('[2][SOCKET EVENTS] SCHEDULE CARD PRICE CHECK ==========[> ', selectedList[0]);
      scheduleCheckCardPrices(userId, selectedList);
      // io.emit('INITIATE_HANDLE_CHECK_CARD_PRICES', { userId, selectedList });

      emitResponse(io, 'INITIATE_HANDLE_CHECK_CARD_PRICES', {
        message: MESSAGES.CARD_PRICES_CHECKED,
        data: {
          userId,
          selectedList,
        },
      });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        new CustomError('Failed to schedule card price check', 500, true, {
          source: ERROR_SOURCES.HANDLE_SCHEDULE_CHECK_CARD_PRICES,
          detail: error.message,
          stack: error.stack,
        }),
      );
    }
  });
};

const handleCheckCardPrices = (socket, io) => {
  socket.on('HANDLE_CHECK_CARD_PRICES', async ({ userId, selectedList }) => {
    try {
      console.log('[3][SOCKET EVENTS] HANDLE CARD PRICE CHECK ==========[> ', selectedList[0]);
      const { pricingData, pricesUpdated, cardsWithChangedPrices } = await checkCardPrices(
        userId,
        selectedList,
      );
      if (!pricingData) {
        throw new CustomError('Failed to check card prices', 500, true, {
          source: ERROR_SOURCES.HANDLE_CHECK_CARD_PRICES,
        });
      }
      if (!pricesUpdated) {
        emitResponse(io, 'NO_PRICE_CHANGES', { message: MESSAGES.NO_PRICE_CHANGES });
        return;
      }
      emitResponse(io, 'SEND_PRICING_DATA_TO_CLIENT', {
        message: MESSAGES.CARD_PRICES_CHECKED,
        data: { pricingData },
      });
      emitResponse(io, 'INITIATE_UPDATE_USER_DATA', {
        message: MESSAGES.CARD_PRICES_CHECKED,
        data: { userId, pricingData },
      });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        error instanceof CustomError
          ? error
          : new CustomError('Failed to check card prices', 500, true, {
              source: ERROR_SOURCES.HANDLE_CHECK_CARD_PRICES,
              detail: error.message,
              stack: error.stack,
            }),
      );
    }
  });
};

const handleUpdateUserData = (socket, io) => {
  socket.on('HANDLE_UPDATE_USER_DATA', async ({ userId, pricingData }) => {
    try {
      // Acquire lock
      if (!acquireLock(userId)) {
        console.log(`[ERROR] Lock acquisition failed for user ${userId}`);
        emitResponse(io, 'ERROR', {
          message: 'User data is currently being updated. Please try again later.',
        });
        return;
      }
      console.log('[4][SOCKET EVENTS] HANDLE UPDATE USER ==========[> ', userId);
      // console.log('[4B][SOCKET EVENTS] HANDLE UPDATE PRICING DATA ==========[> ', pricingData);
      console.log('[4B][SOCKET EVENTS] HANDLE UPDATE USER DATA ==========[> ', pricingData[0]);

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
      console.log('[5][SOCKET EVENTS] HANDLE UPDATE USER COLLECTION ==========[> ', userId);
      const result = await updateUserCollections(userId, updatedData);
      if (!result) {
        console.log('Update skipped. No updated prices.');
        emitResponse(io, 'USER_COLLECTION_UPDATE_SKIPPED', { message: MESSAGES.NO_PRICE_CHANGES });
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
      console.log('[6][SOCKET EVENTS] HANDLE UPDATE AND SYNC COLLECTION ==========[> ', body);
      const result = await handleUpdateAndSync(userId, collectionId, body);
      // const { updatedCollection, message } = result.data;

      // io.emit('COLLECTION_SYNCED', {
      //   message: message || 'Collection has been synced',
      //   updatedCollection,
      // });
      emitResponse(io, 'COLLECTION_SYNCED', { message: MESSAGES.COLLECTION_SYNCED, data: result });
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
    // Additional logic upon disconnection, like cleaning up resources or notifying other users, could be added here
  });
};

// Function to set up socket event listeners
const setupSocketEvents = () => {
  const io = getIO();
  io.on('connection', (socket) => {
    console.log('User connected');

    // List of all socket event handlers
    const handlers = [
      handleMessageFromClient,
      handleStopCronJob,
      handleClientRequestForPriceCheck,
      handleScheduleCheckCardPrices,
      handleCheckCardPrices,
      handleUpdateUserData,
      handleUpdateUserCollectionsSocket,
      handleUpdateAndSyncCollectionSocket,
      handleDisconnect,
    ];

    // Setting up each socket event handler
    handlers.forEach((handler) => handler(socket, io));
  });
};

module.exports = {
  setupSocketEvents,
};
