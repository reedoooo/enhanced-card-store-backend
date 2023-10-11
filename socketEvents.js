const { getIO } = require('./socket');
const { updateUserCollections } = require('./routes/other/cronJob');
const { scheduleCheckCardPrices } = require('./utils/cardUtils');
const User = require('./models/User');
const Collection = require('./models/Collection');

// Assuming you'd use these somewhere
const validateData = (data, properties) => properties.every((prop) => data && data[prop]);

const emitError = (io, errorType, errorMessage) => {
  console.error(errorMessage);
  io.emit(errorType, { message: errorMessage });
};
const handleMessageFromClient = (socket, io) => {
  socket.on('MESSAGE_FROM_CLIENT', (data) => {
    console.log('Received from client:', data);
    // Logic to handle the message, such as storing it, could be added here
    io.emit('MESSAGE_TO_CLIENT', { message: 'Hello to you too, client!' });
  });
};

const handleStartCronJob = (socket, io) => {
  socket.on('START_CRON_JOB', async (data) => {
    if (!data || !data?.userId) {
      return emitError(io, 'error', 'Invalid data received.');
    }

    try {
      await updateUserCollections(data.userId);
    } catch (error) {
      emitError(io, 'error', 'START_CRON_JOB: An error occurred while processing your request.');
    }
  });
};

const handleCheckCardPrices = (socket, io) => {
  socket.on('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', async (data) => {
    // console.log('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', data.data);

    // if (!data || !data?.userId || !data?.listOfMonitoredCards) {
    //   return emitError(io, 'error', 'Invalid data received', data);
    // }

    const { userId, selectedList } = data.data;
    console.log('userId:', userId);
    // console.log('listOfMonitoredCards:', listOfMonitoredCards);
    console.log('selectedList:', selectedList);
    try {
      scheduleCheckCardPrices(userId, selectedList);
    } catch (error) {
      emitError(
        io,
        'error',
        'REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION: An error occurred while processing your request.',
      );
    }
  });
};

const handleRequestExistingCollectionData = (socket, io) => {
  socket.on('REQUEST_EXISTING_COLLECTION_DATA', async (userId) => {
    if (!userId) {
      return emitError(io, 'error', 'no userid.');
    }

    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return emitError(io, 'error', 'User not found.');
      }

      // Fetch all collections associated with the userId
      const userCollections = user.allCollections;

      io.emit('RESPONSE_EXISTING_COLLECTION_DATA', { data: userCollections });
    } catch (error) {
      emitError(io, 'data_error', 'Error retrieving collection data');
    }
  });
};

const handleRequestExistingChartData = (socket, io) => {
  socket.on('REQUEST_EXISTING_CHART_DATA', async (data) => {
    console.log('REQUEST_EXISTING_CHART_DATA:', data);

    if (!data?.data?.userId) {
      return emitError(io, 'error', 'Invalid data received.');
    }

    try {
      const user = await User.findById(data?.data?.userId).populate('allCollections');

      if (!user) {
        return emitError(io, 'error', 'User not found.');
      }

      const userCollections = user.allCollections;

      if (!userCollections || userCollections.length === 0) {
        return emitError(io, 'ERROR', 'No collections found for the user.');
      }

      // Extract chartData and attach the collection's name to it
      let chartData = {};

      userCollections.forEach((collection) => {
        if (collection.chartData) {
          chartData = {
            ...collection.chartData.toObject(),
            collectionName: collection.name,
          };
        }
      });

      console.log('chartData:', chartData);
      io.emit('RESPONSE_EXISTING_CHART_DATA', { data: chartData });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        'REQUEST_EXISTING_CHART_DATA: An error occurred while processing your request.',
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
    handleCheckCardPrices(socket, io);
    handleRequestExistingCollectionData(socket, io);
    handleRequestExistingChartData(socket, io);
    // handleRequestUpdateOrCreateChart(socket, io);
    // handleUpdateForUserCollections(socket, io);
    // handleRequestUpdateCollection(socket, io);
    handleDisconnect(socket);
  });
};

module.exports = {
  setupSocketEvents,
};
