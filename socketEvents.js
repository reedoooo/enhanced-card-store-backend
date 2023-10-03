const { getIO } = require('./socket');
const {
  updateChartData,
  updateCollections,
  generateXYdatasets,
  handleChartDataCreation,
} = require('./routes/other/itemUpdates');
const Collection = require('./models/Collection');
const casual = require('casual');
const mongoose = require('mongoose');

// const { AllCollectionDataSchema, ChartDataSchema } = require('./models/ChartData');
const ChartDataSchema = require('./models/ChartData');
// const AllCollectionDataSchema = require('./models/ChartData');

const { ChartData } = require('./models/ChartData');
const { cronJob } = require('./routes/other/cronJob');

// const handleStartJob = async (userId) => {
//   await cronJob(userId);
//   // Additional logic or emissions if needed...
// };

// const eventHandlers = {
//   START_CRON_JOB: handleStartJob,
//   REQUEST_EXISTING_COLLECTION_DATA: handleRequestExistingCollectionData,
//   // ...add other event handlers here...
// };
const setupSocketEvents = () => {
  const io = getIO();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('MESSAGE_FROM_CLIENT', (data) => {
      console.log('Received from client:', data); // Assuming data.message is 'hello world'

      // Sending a simple reply back to the client
      io.emit('MESSAGE_TO_CLIENT', { message: 'Hello to you too, client!' });
    });

    // socket.on('REQUEST_EXISTING_COLLECTION_DATA', async (data) => {
    //   const userId = data?.userId;
    //   console.log('userid:', userId);

    //   try {
    //     const chartData = await ChartData.find({ userId });
    //     console.log('chart', chartData);

    //     if (chartData && chartData.length > 0) {
    //       io.emit('SEND_S2C_EXISTING_CHART', { data: chartData });
    //     } else {
    //       // Handling case where chartData is not found, etc.
    //       // You may uncomment or adjust this block to handle this case, as per your needs
    //     }
    //   } catch (error) {
    //     console.error('Error retrieving chart data:', error);
    //     socket.emit('ERROR', { message: 'Error retrieving chart data' });
    //   }
    // });

    socket.on('REQUEST_EXISTING_COLLECTION_DATA', async (userId) => {
      console.log('Received initial data request for user:', userId);
      // const { _id } = userId;
      // const userId = userId;
      console.log('usre', userId);
      // console.log('usre', _id);

      try {
        const collections = await Collection.find({ userId: userId.userId });
        // console.log('collection1:', collections);

        if (!collections?.length) {
          io.emit('error', 'No collections found.');
        } else {
          io.emit('SEND_S2C_EXISTING_COLLECTION', { data: collections });
          // io.emit('START_CRON_JOB', { userId: userId });

          // console.log('collection:', collections);
        }
      } catch (error) {
        console.error(error);
        io.emit('data_error', 'Error fetching data from MongoDB');
      }
    });
    socket.on('START_CRON_JOB', async (userId) => {
      userId = userId?.userId;
      console.log('user', userId);
      if (!userId) {
        return io.emit('error', 'UserId is required for starting the cron job');
      }
      console.log('corn job is ready,', userId);
      try {
        // const handler = eventHandlers[type];
        if (userId) {
          await cronJob(userId);
        } else {
          io.emit('error', 'Invalid type specified.');
        }
      } catch (error) {
        console.error('Error:', error);
        io.emit('error', 'An error occurred while processing your request.');
      }
    });
    socket.on('REQUEST_EXISTING_CHART_DATA', async (data) => {
      const userId = data?.userId;
      console.log('userid:', userId);

      try {
        const chartData = await ChartData.find({ userId });
        // console.log('chart', chartData);

        if (chartData && chartData.length > 0) {
          console.log('chart', chartData);

          // Ensure chartData is non-empty
          io.emit('SEND_S2C_EXISTING_CHART', { data: chartData });
        } else {
          // Generate and save fake data if no chart data is found
          // const fakeData = createFakeChartData();
          // fakeData.userId = userId;
          // const newChartData = new ChartData(fakeData);

          try {
            // await newChartData.save();
            // io.emit('CHART_DATA_UPDATED', { chartId: newChartData._id, newData: newChartData });
          } catch (error) {
            console.error('Error adding data to chart:', error);
            io.emit('ERROR', { message: 'Error adding data to chart' });
          }
        }
      } catch (error) {
        console.error('Error retrieving chart data:', error);
        io.emit('ERROR', { message: 'Error retrieving chart data' });
      }
    });

    // socket.on('ADD_DATA_TO_CHART', (data) => {
    //   console.log('Received new data point for chart:', data);
    //   handleChartDataCreation(data);
    //   // Emit or handle the new data point, based on your specific use case
    //   io.emit('HANDLE_ADD_DATA_TO_CHART', data);
    // });
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = { setupSocketEvents };
