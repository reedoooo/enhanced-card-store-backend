const { getIO } = require('./socket');
const { updateUserCollections } = require('./routes/other/cronJob');
const { scheduleCheckCardPrices, cronStop } = require('./utils/cardUtils');
const User = require('./models/User');

// Assuming you'd use these somewhere
const validateData = (data, properties) => properties.every((prop) => data && data[prop]);

const emitError = (
  io,
  errorType,
  errorMessage,
  errorDetail = null,
  source = null,
  errorStack = null,
) => {
  console.error(`Error in ${source || 'Unknown source'}`, errorMessage, errorDetail, errorStack);
  io.emit(errorType, { message: errorMessage, detail: errorDetail, source, errorStack });
};

const handleMessageFromClient = (socket, io) => {
  socket.on('MESSAGE_FROM_CLIENT', (data) => {
    console.log('Received from client:', data);
    // Logic to handle the message, such as storing it, could be added here
    io.emit('MESSAGE_TO_CLIENT', { message: 'Hello to you too, client!' });
  });
};

// const handleStartCronJob = (socket, io) => {
//   socket.on('START_CRON_JOB', async (data) => {
//     if (!data || !data?.userId) {
//       return emitError(io, 'error', 'Invalid data received.');
//     }

//     try {
//       await updateUserCollections(data.userId);
//     } catch (error) {
//       emitError(io, 'ERROR', 'START_CRON_JOB: An error occurred while processing your request.');
//     }
//   });
// };

const handleStopCronJob = (socket, io) => {
  socket.on('STOP_CRON_JOB', async (data) => {
    if (!data || !data?.userId) {
      return emitError(io, 'error', 'Invalid data received.');
    }

    try {
      cronStop(data.userId);
    } catch (error) {
      emitError(io, 'ERROR', 'STOP_CRON_JOB: An error occurred while processing your request.');
    }
  });
};

let isCronJobRunning = false;

const handleStartCronJob = (socket, io) => {
  socket.on('START_CRON_JOB', async (data) => {
    if (!data || !data?.userId) {
      return emitError(io, 'error', 'Invalid data received.');
    }

    if (isCronJobRunning) {
      return emitError(io, 'ERROR', 'A cron job is already running. Please wait.');
    }

    try {
      isCronJobRunning = true;
      await updateUserCollections(data.userId);
    } catch (error) {
      emitError(io, 'ERROR', 'START_CRON_JOB: An error occurred while processing your request.');
    } finally {
      isCronJobRunning = false;
    }
  });
};

let isUpdatingPrices = false;

const handleCheckCardPrices = (socket, io) => {
  socket.on('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', async (data) => {
    const { userId, selectedList } = data.data;
    console.log('userId:', userId);
    console.log('selectedList:', selectedList[0]);

    if (isUpdatingPrices) {
      return emitError(io, 'ERROR', 'Price update is already in progress. Please wait.');
    }

    try {
      isUpdatingPrices = true;
      scheduleCheckCardPrices(userId, selectedList);
    } catch (error) {
      emitError(
        io,
        'ERROR',
        'REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION: An error occurred while processing your request.',
      );
    } finally {
      isUpdatingPrices = false;
    }
  });
};

const handleRequestExistingCollectionData = (socket, io) => {
  socket.on('REQUEST_EXISTING_COLLECTION_DATA', async (data) => {
    console.log('REQUEST_EXISTING_COLLECTION_DATA:', data.userId);
    if (!data?.userId) {
      return emitError(io, 'ERROR', 'No userId.');
    }

    try {
      const user = await User.findById(data.userId).populate('allCollections');
      if (!user) {
        return emitError(io, 'ERROR', 'User not found.');
      }
      const userCollections = user.allCollections.map((collection) => {
        // Adjust the structure as per your need and what should be emitted to the client.
        return {
          _id: collection._id,
          name: collection.name,
          totalPrice: collection.totalPrice,
          updatedAt: collection.updatedAt,
          cards: collection.cards.map((card) => {
            return {
              id: card.id,
              price: card.price,
              // ...other card properties
            };
          }),
        };
      });

      console.log('userCollections:', userCollections);
      io.emit('RESPONSE_EXISTING_COLLECTION_DATA', { data: userCollections });
    } catch (error) {
      emitError(io, 'ERROR', 'Error retrieving collection data');
    }
  });
};

const handleRequestExistingChartData = (socket, io) => {
  socket.on('REQUEST_EXISTING_CHART_DATA', async (data) => {
    console.log('REQUEST_EXISTING_CHART_DATA:', data);
    if (!data?.data?.userId) {
      return emitError(io, 'ERROR', 'Invalid data received.');
    }

    try {
      const user = await User.findById(data.data.userId).populate('allCollections');
      if (!user) {
        return emitError(io, 'ERROR', 'User not found.');
      }

      // Adjust as per your requirement and what should be emitted to the client.
      const existingChartData = user.allCollections.map((collection) => {
        // Assuming collection.currentChartDatasets.data is an array of historical data points.
        return {
          name: collection.name,
          data: collection.currentChartDatasets?.data || [],
        };
      });

      console.log('existingChartData:', existingChartData);
      io.emit('RESPONSE_EXISTING_CHART_DATA', { data: existingChartData });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        'An error occurred while processing your request.',
        error.message,
        'handleRequestExistingChartData',
        error.stack,
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

const setupSocketEvents = () => {
  const io = getIO();
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    handleMessageFromClient(socket, io);
    handleStartCronJob(socket, io);
    handleStopCronJob(socket, io);
    handleCheckCardPrices(socket, io);
    handleRequestExistingCollectionData(socket, io);
    handleRequestExistingChartData(socket, io);
    handleDisconnect(socket);
  });
};

module.exports = {
  setupSocketEvents,
};
