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

const removeDuplicateDataSets = (dataSets) => {
  const seen = new Set();
  return dataSets.filter((dataSet) => {
    const dataSetString = JSON.stringify(dataSet);
    if (seen.has(dataSetString)) {
      return false;
    }
    seen.add(dataSetString);
    return true;
  });
};
const filterOutPriceChangedDatasets = (allDataSets) => {
  return allDataSets.filter((dataSet) => {
    if (dataSet.datasets && Array.isArray(dataSet.datasets)) {
      return !dataSet.datasets.some((data) => data.priceChanged === true);
    }
    return true; // Keep the dataSet if it doesn't contain the datasets array or if none of its datasets have priceChanged set to true
  });
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
      emitError(io, 'ERROR', 'START_CRON_JOB: An error occurred while processing your request.');
    }
  });
};

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

const handleCheckCardPrices = (socket, io) => {
  socket.on('REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION', async (data) => {
    const { userId, selectedList } = data.data;
    console.log('userId:', userId);
    // console.log('listOfMonitoredCards:', listOfMonitoredCards);
    console.log('selectedList:', selectedList);
    try {
      scheduleCheckCardPrices(userId, selectedList);
    } catch (error) {
      emitError(
        io,
        'ERROR',
        'REQUEST_CRON_UPDATED_CARDS_IN_COLLECTION: An error occurred while processing your request.',
      );
    }
  });
};

const handleRequestExistingCollectionData = (socket, io) => {
  socket.on('REQUEST_EXISTING_COLLECTION_DATA', async (data) => {
    console.log('REQUEST_EXISTING_COLLECTION_DATA:', data.userId);
    if (!data?.userId) {
      return emitError(io, 'ERROR', 'no userid.');
    }

    try {
      const user = await User.findById(data.userId);
      if (!user) {
        return emitError(io, 'ERROR', 'User not found.');
      }
      const userCollections = user.allCollections;
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
      io.emit('RESPONSE_EXISTING_CHART_DATA', { data: data.data.chartData });
    } catch (error) {
      emitError(
        io,
        'ERROR',
        'An error occurred while processing your request.',
        error.message,
        'handleRequestExistingChartData',
        error.stack,
        error.source,
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
    // handleRequestUpdateOrCreateChart(socket, io);
    // handleUpdateForUserCollections(socket, io);
    // handleRequestUpdateCollection(socket, io);
    handleDisconnect(socket);
  });
};

module.exports = {
  setupSocketEvents,
};
