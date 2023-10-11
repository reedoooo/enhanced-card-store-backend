// const mongoose = require('mongoose');
// const Collection = require('../../models/Collection');
// const ChartData = require('../../models/ChartData');
// const User = require('../../models/User');
// const { transformedDataSets } = require('./transformedCard');

// const INTERVAL_TIME = 10 * 60 * 1000;

// const handleError = (msg, error = null) => {
//   if (error) console.error(msg, error);
//   else console.error(msg);
//   throw new Error(msg);
// };

// const saveNewChartData = async (userId, xyDatasets, chartId, collectionId) => {
//   try {
//     const totalQuantity = xyDatasets.reduce(
//       (acc, dataPoint) => acc + (dataPoint['total quantity'] || 0),
//       0,
//     );

//     const newChartData = new ChartData({
//       _id: chartId || new mongoose.Types.ObjectId(),
//       userId,
//       collectionId,
//       name: `Dataset ${xyDatasets.length + 1}`,
//       datasets: [
//         {
//           label: 'Set x',
//           totalquantity: totalQuantity,
//           data: { points: xyDatasets },
//           backgroundColor: 'rgba(255, 99, 132, 0.2)',
//           borderColor: 'rgb(255, 99, 132)',
//           borderWidth: 1,
//         },
//       ],
//     });

//     await newChartData.save();
//     return newChartData;
//   } catch (error) {
//     handleError('Failed to save chart data:', error);
//   }
// };

// const newchart = async (userId, xyDatasets, chartId, collectionId) => {
//   const chartData = await saveNewChartData(userId, xyDatasets, chartId, collectionId);
//   const user = await User.findById(userId);
//   if (user && Array.isArray(user.allDataSets)) {
//     user.allDataSets.push(chartData._id);
//     await user.save();
//   } else {
//     handleError('allDataSets is not defined or not an array on the user object');
//   }
//   return chartData;
// };

// const handleChartDataRequest = async (userId, newData) => {
//   if (!userId) handleError('UserId is missing or invalid');

//   let chartData = await ChartData.findOne({ userId });

//   if (!chartData) {
//     const unlinkedCollection = await Collection.findOne({ userId, chartId: { $exists: false } });
//     if (unlinkedCollection) {
//       chartData = await newchart(userId, newData.datasets, undefined, unlinkedCollection._id);
//       unlinkedCollection.chartId = chartData._id;
//       await unlinkedCollection.save();
//     } else {
//       handleError(`No collection found without an associated chart for user ${userId}`);
//     }
//   } else {
//     chartData.datasets.push(...newData.datasets);
//     await chartData.save();
//     await updateChartBasedOnCollection(chartData._id);
//   }

//   const transformedChartData = await transformedDataSets(chartData?.datasets || []);
//   const user = await User.findById(userId);
//   if (!user) handleError(`User not found for ID: ${userId}`);

//   return { chartData: transformedChartData, data: user.allDataSets };
// };

// const updateChartBasedOnCollection = async (chartId) => {
//   const chart = await ChartData.findById(chartId);
//   if (!chart) handleError(`Chart not found for ID: ${chartId}`);

//   const collection = await Collection.findById(chart.collectionId);
//   if (!collection) handleError(`Collection not found for chartId: ${chartId}`);

//   const newDataPoints = await transformedDataSets(collection);
//   chart.datasets = [...chart.datasets, ...newDataPoints];
//   await chart.save();
// };

// setInterval(updateChartBasedOnCollection, INTERVAL_TIME);

// module.exports = {
//   updateChartBasedOnCollection,
//   handleChartDataRequest,
//   newchart,
// };
