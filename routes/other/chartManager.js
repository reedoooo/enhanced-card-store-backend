const Collection = require('../../models/Collection');
const { ChartData } = require('../../models/ChartData');
const User = require('../../models/User');

// ------------------- Utility Functions -------------------

const getUpdatedPrice = async (collection) => {
  if (!Array.isArray(collection.cards)) {
    throw new Error('Expected collection.cards to be an array');
  }
  const newDataPoints = [];
  console.log('collection', collection);
  const totalPrice = collection.cards.reduce((total, card) => {
    if (Array.isArray(collection.datasets)) {
      const previousCardPriceHistory = collection.chartData.find(
        (dataPoint) => String(dataPoint.cardId) === String(card._id),
      );

      if (previousCardPriceHistory) {
        const priceDifference = card.price - previousCardPriceHistory.y;
        if (priceDifference !== 0) {
          newDataPoints.push({
            x: new Date(),
            y: card.price,
            priceChanged: true,
            cardName: card.name, // Assuming card has a 'name' field
            cardId: card._id,
            priceDifference: priceDifference,
          });
        }
      } else {
        // No previous history for this card
        newDataPoints.push({
          x: new Date(),
          y: card.price,
          priceChanged: false,
          cardName: card.name,
          cardId: card._id,
          priceDifference: 0,
        });
      }

      return total + card.price;
    } else {
      console.error('datasets is not an array on the collection object:', collection);
      // Handle error accordingly
    }
  }, 0);

  return {
    totalPrice,
    newDataPoints,
  };
};

// ------------------- Chart Handling Functions -------------------

const newchart = async (userId, xyDatasets, chartId) => {
  const newChartData = new ChartData({
    _id: chartId,
    userId,
    name: `Dataset ${xyDatasets.length + 1}`,
    datasets: xyDatasets,
  });

  await newChartData.save();
  if (!userId) {
    throw new Error('UserId is missing or invalid');
  }

  const user = await User.findById(userId);
  // console.log('collection', user);

  if (user && Array.isArray(user.allDataSets)) {
    user.allDataSets.push(newChartData._id); // push the ID, not the whole object
    await user.save();
  } else {
    console.error('allDataSets is not defined or not an array.');
  }

  return newChartData;
};

const handleChartDataRequest = async (userId, newData) => {
  if (!userId) {
    throw new Error('UserId is missing or invalid');
  }
  console.log('userIduserIduserIduserIduserIduserId', userId);

  let chartData = await ChartData.findOne({ userId });
  console.log('chartData', chartData);

  if (chartData) {
    // Assuming newData.datasets is an array you want to merge
    chartData.datasets.push(...newData.datasets);
    await chartData.save();
  } else {
    chartData = await newchart(userId, newData.datasets);
  }
  console.log('chartData', chartData);
  const user = await User.findById(userId);

  return { chartData, data: user.allDataSets };
};

const updateChartBasedOnCollection = async (chartId) => {
  try {
    const chart = await ChartData.findById(chartId).populate('datasets');
    if (!chart) {
      throw new Error(`Chart not found for ID: ${chartId}`);
    }

    const collection = await Collection.findById(chart.collectionId).populate('cards');
    if (!collection) {
      throw new Error(`Collection not found for ID: ${chart.collectionId}`);
    }

    const { totalPrice, newDataPoints } = await getUpdatedPrice(collection);
    chart.datasets = chart.datasets.concat(newDataPoints);
    await chart.save();
  } catch (error) {
    console.error(`Failed to update chart ${chartId}:`, error.message, 'Error:', error);
  }
};

// ------------------- Interval for Updating Charts -------------------

const INTERVAL_TIME = 10 * 60 * 1000;

setInterval(async () => {
  try {
    const charts = await ChartData.find({});
    for (const chart of charts) {
      await updateChartBasedOnCollection(chart._id);
    }
  } catch (error) {
    console.error('Failed to update charts:', error.message);
  }
}, INTERVAL_TIME);

// ------------------- Exports -------------------

module.exports = {
  updateChartBasedOnCollection,
  handleChartDataRequest,
  newchart,
};
