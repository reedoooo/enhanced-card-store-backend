const { getIO } = require('./socket');
const { handleChartDataRequest } = require('./routes/other/chartManager');
const { Collection, CollectionModel } = require('./models/Collection');
const { cronJob } = require('./routes/other/cronJob');
const User = require('./models/User');
const { ChartData } = require('./models/ChartData');
const { transformedDataSets } = require('./routes/other/transformedCard');

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

const handleUpdateForUserCollections = async (user, io) => {
  try {
    for (const collectionId of user.allCollections) {
      const collection = await Collection.findById(collectionId);
      // NOTE: Replacing `find({})` with `findById(collectionId)`

      // Only emit if there are collections to avoid unnecessary socket emission.
      if (collection) {
        io.emit('updateCollection', {
          userId: user._id,
          collectionId: collection._id,
          updatedAt: collection.updatedAt,
        });
      } else {
        emitError(io, 'error', `No collection found for ID: ${collectionId}`);
      }
    }

    if (!user.allCollections?.length) {
      emitError(io, 'error', 'No collections found.');
    } else {
      io.emit('SEND_S2C_EXISTING_COLLECTION', { data: user.allCollections });
    }
  } catch (error) {
    emitError(io, 'data_error', 'Error updating user collections');
  }
};

const handleRequestExistingCollectionData = (socket, io) => {
  socket.on('REQUEST_EXISTING_COLLECTION_DATA', async (userId) => {
    if (!userId) {
      return emitError(io, 'error', 'no userid.');
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return emitError(io, 'error', 'User not found.');
      }
      io.emit('SEND_S2C_EXISTING_COLLECTION', { data: user.allCollections });
    } catch (error) {
      emitError(io, 'data_error', 'Error fetching data from MongoDB');
    }
  });
};

const handleStartCronJob = (socket, io) => {
  socket.on('START_CRON_JOB', async (data) => {
    if (!data || !data?.userId) {
      return emitError(io, 'error', 'Invalid data received.');
    }

    try {
      await cronJob(data.userId);
    } catch (error) {
      emitError(io, 'error', 'An error occurred while processing your request.');
    }
  });
};

const handleRequestExistingChartData = (socket, io) => {
  socket.on('REQUEST_EXISTING_CHART_DATA', async (data) => {
    if (!data?.userId) {
      return emitError(io, 'error', 'Invalid data received.');
    }

    try {
      const { chartData: myChartData, data: myData } = await handleChartDataRequest(
        data.userId,
        data.name,
        data.datasets,
      );
      io.emit('SEND_S2C_EXISTING_CHART', { myChartData, myData });
    } catch (error) {
      emitError(io, 'ERROR', 'Error retrieving or updating chart data');
    }
  });
};
const handleRequestUpdateOrCreateChart = (socket, io) => {
  socket.on('REQUEST_UPDATE_OR_CREATE_CHART', async ({ userId, chartId, datasets, name }) => {
    try {
      if (!userId) {
        return emitError(io, 'error', 'User ID not provided.');
      }

      if (chartId) {
        // Update existing chart logic
        const chartData = await ChartData.findById(chartId);
        if (!chartData) {
          return emitError(io, 'error', `No chart found for ID: ${chartId}`);
        }

        // Assuming datasets is an array you want to merge
        chartData.datasets.push(...datasets);
        await chartData.save();

        io.emit('CHART_UPDATED', {
          message: 'Chart has been updated',
          chartId: chartData._id,
        });
      } else {
        // Create a new chart logic
        const { chartData } = await handleChartDataRequest(userId, name, datasets);
        io.emit('NEW_CHART_CREATED', {
          message: 'New chart has been created',
          chartData,
        });
      }
    } catch (error) {
      console.error('Error handling request to update or create chart:', error);
      emitError(io, 'ERROR', 'Error handling request to update or create chart');
    }
  });
};

const handleRequestUpdateCollection = (socket, io) => {
  socket.on('REQUEST_UPDATE_COLLECTION', async ({ userId, collectionId, data: collectionData }) => {
    if (!userId || !collectionId || !collectionData) {
      emitError(io, 'error', 'Invalid data received.');
      return;
    }

    try {
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        return emitError(io, 'error', `No collection found for ID: ${collectionId}`);
      }

      for (const key in collectionData) {
        collection[key] = collectionData[key];
      }
      await collection.save();

      io.emit('COLLECTION_UPDATED', {
        message: 'Collection has been updated',
        collectionId: collection._id,
      });
    } catch (error) {
      console.error('Error updating collection:', error);
      emitError(io, 'data_error', 'Error updating collection in MongoDB');
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
    handleRequestUpdateOrCreateChart(socket, io);
    handleRequestExistingCollectionData(socket, io);
    handleStartCronJob(socket, io);
    handleRequestExistingChartData(socket, io);
    handleRequestUpdateCollection(socket, io);
    handleDisconnect(socket);
  });
};

module.exports = {
  setupSocketEvents,
};
