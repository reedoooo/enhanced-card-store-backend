const { getIO } = require('./socket');
const { handleChartDataRequest } = require('./routes/other/chartManager');
const { Collection, CollectionModel } = require('./models/Collection');
const { cronJob } = require('./routes/other/cronJob');
const User = require('./models/User');

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

// const handleRequestExistingCollectionData = (socket, io) => {
//   console.log('requesting existing collection data');
//   socket.on('REQUEST_EXISTING_COLLECTION_DATA', async (userId) => {
//     if (!userId) {
//       console.error('Invalid data received:', userId);
//       return io.emit('error', 'Invalid data received');
//     }
//     console.log('Received initial data request for collection:', userId);
//     try {
//       const users = await User.find();
//       for (const user of users) {
//         if (!Array.isArray(user?.allCollections)) return;

//         for (const collectionId of user.allCollections) {
//           console.log('Updating collection:', collectionId);
//           typeof collectionId === 'string' && console.log('collectionId is a string');
//           const collection = await Collection.findById(collectionId);

//           io.emit('updateCollection', {
//             userId: user._id,
//             collectionId: collection?._id,
//             updatedAt: collection?.updatedAt,
//           });
//           if (!user.allCollections?.length) {
//             io.emit('error', 'No collections found.');
//           } else {
//             io.emit('SEND_S2C_EXISTING_COLLECTION', { data: user.allCollections });
//           }
//         }
//         // const collections = await Collection?.find({ _id: userId });
//         // console.log('collections', collections);
//       }
//     } catch (error) {
//       console.error(error);
//       io.emit('data_error', 'Error fetching data from MongoDB');
//     }
//   });
// };
const handleRequestExistingCollectionData = (socket, io) => {
  socket.on('REQUEST_EXISTING_COLLECTION_DATA', async (userId) => {
    if (!userId) {
      return emitError(io, 'error', 'Invalid data received.');
    }

    try {
      const user = await User.findById(userId);
      // NOTE: Fetching a specific user instead of looping through all users
      if (!user) {
        return emitError(io, 'error', 'User not found.');
      }
      await handleUpdateForUserCollections(user, io);
    } catch (error) {
      emitError(io, 'data_error', 'Error fetching data from MongoDB');
    }
  });
};

const handleStartCronJob = (socket, io) => {
  console.log('starting cron job');
  socket.on('START_CRON_JOB', async (data) => {
    console.log('Received cron job start request from:', data);
    if (!data || !data.userId) {
      console.error('Invalid data received:', data);
      return io.emit('error', 'Invalid data received');
    }
    const { userId } = data;
    console.log('Received cron job start request from:', userId);
    try {
      if (userId) {
        await cronJob(userId); // Assuming `cronJob` is designed to use a `userId`
      } else {
        io.emit('error', 'Invalid user ID.');
      }
    } catch (error) {
      console.error('Error:', error);
      io.emit('error', 'An error occurred while processing your request.');
    }
  });
};

const handleRequestExistingChartData = (socket, io) => {
  console.log('requesting existing chart data');
  socket.on('REQUEST_EXISTING_CHART_DATA', async (data) => {
    console.log('requesting CHART: data', data);

    if (!data || !data.userId) {
      console.error('Invalid data received:', data);
      return io.emit('error', 'Invalid data received');
    }
    // console.log('Received initial data request for chart:', data);
    const { datasets, name, userId } = data;
    console.log('Received initial data request for chart:', userId);
    console.log('Received initial data request for chart:', name);
    console.log('Received initial data request for chart:', datasets.data);
    try {
      const { chartData: myChartData, data: myData } = await handleChartDataRequest(
        userId,
        name,
        datasets,
      );
      console.log('Received initial data request for chart:', datasets.data);

      io.emit('SEND_S2C_EXISTING_CHART', { myChartData, myData });
    } catch (error) {
      console.error('Error retrieving or updating chart data:', error);
      io.emit('ERROR', { message: 'Error retrieving or updating chart data' });
    }
  });
};

const handleRequestUpdateCollection = (socket, io) => {
  socket.on('REQUEST_UPDATE_COLLECTION', async (data) => {
    if (!data || !data.userId || !data.collectionId || !data.collectionData) {
      console.error('Invalid data received:', data);
      return io.emit('error', 'Invalid data received');
    }
    const { userId, collectionId, collectionData } = data;
    console.log('REQUEST: COLLECTION DATA', userId);
    console.log('+', collectionId);
    console.log('+', collectionData);

    console.log('Received update collection request from:', userId);
    console.log('Received update collection request from:', collectionId);
    console.log('Received update collection request from:', collectionData);
    try {
      const user = await User.findById(userId);

      if (!user) {
        return emitError(io, 'error', 'User not found.');
      }
      const collection = await Collection.findById(collectionId);

      // Ensuring collection exists
      if (!collection) {
        return emitError(io, 'error', `No collection found for ID: ${collectionId}`);
      }

      const updatedCollection = await Collection.updateOne(
        { _id: collectionId },
        { $set: collectionData }, // This assumes `collectionData` is structured correctly for the update
      );
      io.emit('COLLECTION_UPDATED', {
        message: 'Collection has been updated',
        data: updatedCollection,
      });
    } catch (error) {
      console.error(error);
      io.emit('data_error', 'Error updating collection in MongoDB');
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
