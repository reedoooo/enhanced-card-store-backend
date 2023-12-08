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
const { logData, logError } = require('./utils/loggingUtils');

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
    try {
      // Check if selectedList is long enough
      if (data?.data?.selectedList?.length >= 5) {
        await processCardPriceRequest(data, io);

        // Setup cron job only if the list is long enough
        setupCronJob(getIO(), trackCardPrices, '*/2 * * * *'); // Tracks card prices every 2 minutes
      } else {
        logData('Waiting for selectedList to have at least 5 items.');
      }
    } catch (error) {
      emitError(io, 'ERROR', error);
      logError(error);
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
