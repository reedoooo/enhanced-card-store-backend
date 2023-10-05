const Collection = require('../../models/Collection');
const { ChartData } = require('../../models/ChartData');
const User = require('../../models/User');
const { transformedDataSets } = require('./transformedCard');

const INTERVAL_TIME = 10 * 60 * 1000;

const getUpdatedPrice = async (collection) => {
  if (!collection || !Array.isArray(collection.cards) || !collection.cards.length) {
    throw new Error('Expected collection.cards to be a non-empty array');
  }

  return collection.cards.reduce((acc, card) => {
    if (Array.isArray(collection.chartData)) {
      const previousCardPriceHistory = collection.chartData.find(
        (dataPoint) => String(dataPoint?.cardId) === String(card?._id),
      );

      const priceDifference = card.price - (previousCardPriceHistory?.y || 0);
      if (priceDifference === 0) return acc;

      const priceChangePercent = (priceDifference / (previousCardPriceHistory?.y || 1)) * 100;
      acc.push({
        x: new Date().toLocaleDateString(),
        y: card.price,
        'price change': priceDifference,
        'price change %': priceChangePercent,
        quantity: collection.cards.length,
        'individual quantity': card.quantity || 0,
        'total price': card.price * (card.quantity || 0),
        priceChanged: priceDifference !== 0,
        cardName: card.name,
        cardId: card._id,
        priceDifference,
      });
    } else {
      console.error('chartData is not an array on the collection object');
    }
    return acc;
  }, []);
};

const newchart = async (userId, xyDatasets, chartId) => {
  if (!userId) {
    throw new Error('UserId is missing or invalid');
  }

  xyDatasets?.forEach((dataPoint) => {
    if (isNaN(dataPoint['total quantity']) || dataPoint['total quantity'] === undefined) {
      console.error('Erroneous data point:', dataPoint);
    }
  });

  const totalQuantity = xyDatasets.reduce(
    (acc, dataPoint) => acc + (dataPoint['total quantity'] || 0),
    0,
  );

  const newChartData = new ChartData({
    _id: chartId,
    userId,
    name: `Dataset ${xyDatasets.length + 1}`,
    datasets: [
      {
        label: 'Set x',
        totalquantity: totalQuantity,
        data: { points: xyDatasets },
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
      },
    ],
  });

  await newChartData.save();

  const user = await User.findById(userId);
  if (user && Array.isArray(user.allDataSets)) {
    user.allDataSets.push(newChartData._id);
    await user.save();
  } else {
    console.error('allDataSets is not defined or not an array on the user object');
  }

  return newChartData;
};

const handleChartDataRequest = async (userId, newData) => {
  if (!userId) {
    throw new Error('UserId is missing or invalid');
  }

  const chartData = await ChartData.findOne({ userId });
  const transformedChartData = await transformedDataSets(chartData?.datasets || []);

  if (!chartData) {
    const unlinkedCollection = await Collection.findOne({ userId, chartId: { $exists: false } });
    if (unlinkedCollection) {
      const chart = await newchart(userId, newData.datasets);
      unlinkedCollection.chartId = chart._id;
      await unlinkedCollection.save();
    } else {
      console.error('No collection found without an associated chart for user', userId);
      return;
    }
  } else {
    chartData.datasets.push(...newData.datasets);
    await chartData.save();
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found for ID: ${userId}`);
  }

  return { chartData: transformedChartData, data: user.allDataSets };
};

const updateChartDataForAllCharts = async () => {
  const charts = await ChartData.find({});
  for (const chart of charts) {
    await updateChartBasedOnCollection(chart._id);
  }
};

const updateChartBasedOnCollection = async (chartId) => {
  const chart = await ChartData.findById(chartId).populate('datasets');
  if (!chart) {
    throw new Error(`Chart not found for ID: ${chartId}`);
  }

  const collection = await Collection.findById(chart.collectionId).populate('cards');
  if (!collection) {
    throw new Error(`Collection not found for chartId: ${chartId}`);
  }

  const newDataPoints = await getUpdatedPrice(collection);
  chart.datasets = [...chart.datasets, ...newDataPoints];
  await chart.save();
};

setInterval(updateChartDataForAllCharts, INTERVAL_TIME);

module.exports = {
  updateChartBasedOnCollection,
  handleChartDataRequest,
  newchart,
};
