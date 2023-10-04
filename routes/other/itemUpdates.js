// Imports
const axios = require('axios');
const Collection = require('../../models/Collection');
const { ChartData, ChartDataSchema } = require('../../models/ChartData');
const winston = require('winston');
const User = require('../../models/User');
const mongoose = require('mongoose');
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

const state = {
  xyDatasets: [],
  yUpdateDataset: [],
  userId: '',
  allChartData: [],
};

// [6] Function: setUserId - Set User ID
const setUserId = (userId) => {
  if (typeof userId === 'string') {
    state.userId = userId;
  } else {
    console.error('User ID must be a string:', userId);
  }
};

const generateXYdatasets = async ({
  userId = state?.userId,
  chartId = state?.chartData?._id || '',
  collectionId = null,
  cardId = null,
  cardName = null,
  prices: { initialPrice = 0, updatedPrice = 0, totalPrice = 0 } = {},
  date = new Date(),
  priceChanged = false,
} = {}) => {
  // Ensure prices are valid numbers
  [initialPrice, updatedPrice, totalPrice] = [initialPrice, updatedPrice, totalPrice].map(
    ensureNumber,
  );

  [initialPrice, updatedPrice, totalPrice] = [initialPrice, updatedPrice, totalPrice].map((price) =>
    roundMoney(ensureNumber(price)),
  );

  if ([initialPrice, updatedPrice, totalPrice].includes(NaN)) {
    console.error('Price values must be numbers or convertible to numbers.');
    return;
  }

  // const roundMoney = (amount) => Math.round(amount * 100) / 100;
  const calculatePriceDifference = (initialPrice, updatedPrice) => updatedPrice - initialPrice;
  const calculateNewTotalPrice = (totalPrice, priceDifference) => totalPrice + priceDifference;

  // Calculate relevant price and total values
  const priceDifference = calculatePriceDifference(initialPrice, updatedPrice);
  const oldTotalPrice = totalPrice; // Assuming totalPrice is already defined in your code.
  const newTotalPrice = roundMoney(calculateNewTotalPrice(totalPrice, priceDifference));

  // Log the old and new total prices
  // console.log('OLD TOTAL PRICE:', colors.magenta(oldTotalPrice.toString()));
  // console.log('NEW TOTAL PRICE:', colors.magenta(newTotalPrice.toString()));

  const io = getIO();
  // Check for duplicate data and update dataset
  if (!isDuplicateDataPoint(state.xyDatasets, date, cardId)) {
    const newDataset = createNewDataset(
      date,
      newTotalPrice,
      cardId,
      priceChanged,
      cardName,
      priceDifference,
    );
    state.xyDatasets.push(newDataset);
  }

  // Update Y Dataset and emit new chart data
  const totalY = calculateTotalY(state.xyDatasets);
  state.yUpdateDataset = createUpdateDataset(date, totalY, collectionId);
  // console.log('state.yUpdateDataset', state.yUpdateDataset);
  // console.log('state.totalY', totalY);
  try {
    const chartData = await newchart(userId, state.xyDatasets);
    io.emit('NEW_CHART', { data: chartData });
  } catch (error) {
    console.error('Error saving chart data:', error.message);
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

// [11] Function: updateCardPrice - Update Card Price
const updateCardPrice = async (card, cardInfo, userId, collectionId, chartId) => {
  if (!validateCardData(card) || !validateCardData(cardInfo)) {
    console.error(colors.red('Error: Invalid card or cardInfo data provided'));
    return null;
  }

  const initialPrice = card.card_prices[0]?.tcgplayer_price;
  // typeof initialPrice === 'number' && console.log('initialPrice', initialPrice);
  const updatedPrice = cardInfo.card_prices[0]?.tcgplayer_price;
  // typeof updatedPrice === 'number' && console.log('updatedPrice', updatedPrice);
  const cardQuantity = typeof card.quantity === 'number' ? card?.quantity : 1;
  // typeof cardQuantity === 'number' && console.log('cardQuantity', cardQuantity);
  const totalCardPrice = updatedPrice * cardQuantity;
  // console.log('totalCardPrice', totalCardPrice);
  const priceDifference = initialPrice - updatedPrice;
  const priceChanged = updatedPrice !== initialPrice ? true : false;

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

  await generateXYdatasets({
    userId,
    collectionId,
    cardId: card._id,
    initialPrice,
    updatedPrice,
    chartId,
    prices: {
      initialPrice,
      updatedPrice,
      totalPrice: totalCardPrice,
    },
    date: new Date(),
    priceChanged,
  });

  const isValidObjectId = (str) => {
    return /^[a-f\d]{24}$/i.test(str);
  };
  // console.log('chartId:', chartId);

  if (priceDifference !== 0) {
    if (!mongoose.Types.ObjectId.isValid(chartId)) {
      console.error('Invalid user ID:', chartId);
      return null;
    }

    const dataset = generateXYdatasets(new Date(), totalCardPrice);

    try {
      // console.log('chartId:', chartId);

      if (!isValidObjectId(chartId)) {
        console.error('Invalid chartId:', chartId);
        return;
      }

      if (isValidObjectId(chartId)) {
        newchart(userId, chartId, dataset);
      } else {
        console.error('Invalid chartId:', chartId);
      }
    } catch (err) {
      console.error('Error creating ChartData:', err.message);
    }

    return { updatedPrices: { tcgplayer_price: updatedPrice }, totalCardPrice };
  }
  return { updatedPrices: {}, totalCardPrice: 0 };
};

const updateAllUserData = async () => {
  try {
    const users = await User.find({});
    if (!Array.isArray(users)) return;

    for (const user of users) {
      await this.updateCollections(user);
    }
  } catch (error) {
    console.error('Failed to update user data:', error.message);
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
