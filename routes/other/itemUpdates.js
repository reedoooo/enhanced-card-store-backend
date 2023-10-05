const User = require('../../models/User');
const { getIO } = require('../../socket');
const colors = require('colors');
const {
  getCardInfo,
  convertUserIdToObjectId,
  getCardPriceHistory,
  validateCardData,
} = require('../../utils/cardUtils');
const { ensureNumber, roundMoney } = require('../../utils/utils');
const { updateChartBasedOnCollection, newchart } = require('./chartManager');
const { ChartData } = require('../../models/ChartData');

const state = {
  xyDatasets: [],
  yUpdateDataset: [],
  userId: '',
};

const setUserId = (userId) => {
  if (typeof userId === 'string') {
    state.userId = userId;
  } else {
    console.error('User ID must be a string:', userId);
  }
};

const isDuplicateDataPoint = (dataset, date, cardId) =>
  dataset.some((data) => data.x.getTime() === date.getTime() && data.cardId === cardId);

const createNewDataset = (date, newTotalPrice, cardId, priceChanged, cardName, priceChange) => ({
  x: date,
  y: newTotalPrice,
  cardId,
  priceChanged,
  cardName,
  priceChange,
});

const calculateTotalY = (xyDatasets) =>
  xyDatasets.reduce((acc, dataPoint) => acc + dataPoint?.y, 0);

const createUpdateDataset = (date, totalY, collectionId) => [
  {
    x: date,
    y: totalY,
    collectionId,
  },
];

const isValidObjectId = (str) => /^[a-f\d]{24}$/i.test(str);

const handleInvalidObjectId = (chartId) => {
  if (!isValidObjectId(chartId)) {
    console.error('Invalid chartId:', chartId);
    return false;
  }
  return true;
};

const generateXYdatasets = async (params) => {
  try {
    const {
      userId = state.userId,
      collectionId = null,
      cardId = null,
      cardName = null,
      prices: { initial = 0, updated = 0, total = 0 } = {},
      date = new Date(),
      priceChanged = false,
    } = params;

    const [initialPrice, updatedPrice, totalPrice] = [initial, updated, total]
      .map(ensureNumber)
      .map(roundMoney);

    if ([initialPrice, updatedPrice, totalPrice].includes(NaN)) {
      console.error(
        'Price values must be numbers or convertible to numbers:',
        initialPrice,
        updatedPrice,
        totalPrice,
      );
      return;
    }

    if (!isDuplicateDataPoint(state.xyDatasets, date, cardId)) {
      const newDataset = createNewDataset(
        date,
        totalPrice,
        cardId,
        priceChanged,
        cardName,
        updatedPrice - initialPrice,
      );
      state.xyDatasets.push(newDataset);
    }

    const totalY = calculateTotalY(state.xyDatasets);
    state.yUpdateDataset = createUpdateDataset(date, totalY, collectionId);

    const chartData = await newchart(userId, state.xyDatasets);

    if (!chartData || !chartData._id) {
      console.error('Trying to save chartData without an _id:', chartData);
      return;
    }

    getIO().emit('NEW_CHART', { data: chartData });
  } catch (error) {
    console.error('Error in generateXYdatasets:', error);
  }
};
const updateCardPrice = async (card, cardInfo, userId, collectionId, chartId) => {
  try {
    if (!validateCardData(card) || !validateCardData(cardInfo)) {
      console.error(colors.red('Error: Invalid card or cardInfo data provided'));
      return null;
    }

    const initial = card.card_prices[0]?.tcgplayer_price; // changed from initialPrice
    const updated = cardInfo.card_prices[0]?.tcgplayer_price; // changed from updatedPrice
    const cardQuantity = typeof card.quantity === 'number' ? card?.quantity : 1;
    const total = updated * cardQuantity; // changed from totalCardPrice
    const priceChanged = updated !== initial;
    // console.log(colors.blue('-----------------------------------'));
    // console.log(colors.blue('           Updating Card Price           '));
    // console.log(colors.blue('-----------------------------------'));
    // console.log(colors.cyan(`User ID: ${userId}`));
    // console.log(colors.cyan(`Collection ID: ${collectionId}`));
    // console.log(colors.cyan(`Chart ID: ${chartId}`));
    // console.log('Card Data: ');
    // console.log(`  Card ID: ${colors.green(card._id)}`);
    // console.log(`  Initial Price: ${colors.magenta(initialPrice.toString())}`);
    // console.log('Card Info Data: ');
    // console.log(`  Updated Price: ${colors.magenta(updatedPrice.toString())}`);
    // console.log(`  Card Quantity: ${colors.green(cardQuantity.toString())}`);
    // console.log(`  Total Card Price: ${colors.green(totalCardPrice.toString())}`);
    // console.log(
    //   `  Price Difference: ${colors[priceDifference < 0 ? 'red' : 'green'](
    //     priceDifference.toString(),
    //   )}`,
    // );
    // console.log(`  Price Changed: ${colors[priceChanged ? 'yellow' : 'white']('Yes')}`);
    // console.log(colors.blue('-----------------------------------'));
    console.log('chartId before generateXYdatasets:', chartId);

    const chartData = await generateXYdatasets({
      userId,
      collectionId,
      cardId: card._id,
      cardName: cardInfo.name,
      initial,
      updated,
      chartId,
      prices: { initial, updated, total },
      date: new Date(),
      priceChanged,
    });

    if (!chartData?._id) {
      console.error('Trying to save chartData without an _id:', chartData);
      // Create a new chart if none was returned
      chartId = await newchart(userId);
    } else {
      chartId = chartData._id;
    }

    console.log('chartId after checking and possibly creating:', chartId);

    if (handleInvalidObjectId(chartId)) {
      const dataset = generateXYdatasets(new Date(), total);
      newchart(userId, chartId, dataset);
    }

    return { updatedPrices: { tcgplayer_price: updated }, totalCardPrice: total };
  } catch (error) {
    console.error('Error in updateCardPrice:', error);
  }
};

// // Delete all documents with a priceChange of 0
// ChartData.deleteMany({ priceChange: 0 })
//   .then((result) => {
//     console.log(
//       'Data points with priceChange of 0 were successfully deleted:',
//       result.deletedCount,
//     );
//   })
//   .catch((err) => {
//     console.error('Error deleting data points:', err);
//   });

const updateAllUserData = async () => {
  try {
    const users = await User.find({});
    if (!Array.isArray(users)) return;

    for (const user of users) {
      await this.updateCollections(user);
    }
  } catch (error) {
    console.error('Failed to update user data:', error);
  }
};

module.exports = {
  getCardInfo,
  convertUserIdToObjectId,
  getCardPriceHistory,
  updateChartBasedOnCollection,
  validateCardData,
  setUserId,
  generateXYdatasets,
  updateCardPrice,
  updateAllUserData,
};
