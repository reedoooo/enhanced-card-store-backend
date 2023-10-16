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
