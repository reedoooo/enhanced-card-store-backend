const ChartData = require('../../models/ChartData');
const User = require('../../models/User');

const saveNewChartData = async (dataSetName, dataSetValues, userId) => {
  const newChartData = new ChartData({
    name: dataSetName,
    data: dataSetValues,
    userId: userId,
  });
  await newChartData.save();
  return newChartData;
};

const getUserById = async (userId) => {
  return await User.findById(userId);
};

const finalizeItemData = async (variables) => {
  try {
    const finalizedData = {
      ...variables,
      finalizedPrice: variables?.allItemPrices?.reduce((acc, price) => acc + price, 0),
    };

    return finalizedData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const initializeVariables = async (item) => {
  try {
    const itemType = item.constructor.modelName;

    const variables = {
      itemType,
      allItemPrices: [],
    };

    return variables;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  saveNewChartData,
  getUserById,
  finalizeItemData,
  initializeVariables,
};
