// const { ChartData } = require('../../../models/ChartData');

// async function validateAndSaveData({ userId, data, name, _id, datasets, result }) {
//   const existingData = await ChartData.findOne({ userId, data });
//   if (existingData) throw new Error('Identical data already exists');

//   const newData = new ChartData({ userId, data, name, _id, datasets });
//   await newData.save();

//   result.user.allDataSets.push(newData._id);
//   await result.user.save();
// }

// function delay(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// module.exports = {
//   validateAndSaveData,
//   delay,
// };
