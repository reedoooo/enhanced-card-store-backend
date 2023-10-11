// const { ChartData } = require('../../../models/ChartData');
// const socket = require('../../../socket');

// const addNewDataSet = async (name, datasets, userId) => {
//   try {
//     const newChartData = new ChartData({
//       name: name,
//       datasets: datasets,
//       userId: userId,
//     });

//     await newChartData.save();

//     const io = socket.getIO;
//     io.emit('newDataSetAdded', { data: newChartData });
//   } catch (error) {
//     console.error('Error adding new data set: ', error);
//   }
// };

// module.exports = {
//   addNewDataSet,
// };
