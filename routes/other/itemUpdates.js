// Imports
const axios = require('axios');
const Collection = require('../../models/Collection');
const { saveNewChartData } = require('./chartDataLayer');
const { addNewDataSet } = require('./chartHelpers');
const { ChartData, ChartDataSchema } = require('../../models/ChartData');
const winston = require('winston');
const { getIO } = require('../../socket');
const User = require('../../models/User');
const colors = require('colors');
const { default: mongoose } = require('mongoose');
// Axios instance creation
const instance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

const cardPriceUpdates = {};
const datasets = [];

const getCardInfo = async (cardId) => {
  try {
    const response = await instance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    return response.data.data[0];
  } catch (error) {
    console.error('Error fetching card info: ', error);
    return null;
  }
};

const getCardPriceHistory = async (cardId) => {
  try {
    const priceHistory = await ChartData.find({ cardId }).sort({ date: 1 });
    return priceHistory;
  } catch (error) {
    console.error('Error fetching price history: ', error);
    return [];
  }
};

const validateCardData = (card) => {
  if (!card || typeof card !== 'object' || !card.card_prices || !Array.isArray(card.card_prices)) {
    console.error('Invalid card data: ', card);
    return false;
  }
  return true;
};

const validateCardInfo = (cardInfo) => {
  if (
    !cardInfo ||
    typeof cardInfo !== 'object' ||
    !cardInfo.card_prices ||
    !Array.isArray(cardInfo.card_prices)
  ) {
    console.error('Invalid cardInfo data: ', cardInfo);
    return false;
  }
  return true;
};

// Your imports and other codes...

// Assuming this is a module-wide state array
const state = {
  xyDatasets: [],
  yUpdateDataset: [], // New dataset to hold the accumulated y values
  userId: '',
};

const setUserId = (userId) => {
  console.log(userId);
  // Check if the userId is either a string or a Mongoose ObjectId
  if (typeof userId === 'string' || userId instanceof mongoose.Types.ObjectId) {
    // Ensure the userId is a valid Mongoose ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      state.userId = userId;
      console.log('USER', state.userId);
    } else {
      console.error('Invalid user ID:', userId);
    }
  } else {
    console.error('User ID must be a string or a Mongoose ObjectId:', userId);
  }
};

const generateXYdatasets = async (
  userId = state.userId,
  collectionId = null,
  cardId = null,
  initialPrice = 0,
  updatedPrice = 0,
  totalPrice = 0,
  date = new Date(),
) => {
  if (initialPrice !== updatedPrice) {
    initialPrice = Number(initialPrice);
    updatedPrice = Number(updatedPrice);
    totalPrice = Number(totalPrice);
    if (isNaN(initialPrice) || isNaN(updatedPrice) || isNaN(totalPrice)) {
      console.error('Price values must be numbers or convertible to numbers.');
      return;
    }
    console.log('generateXYdatasets has been reacheed', userId);

    const priceDifference = initialPrice - updatedPrice;
    const newTotalPrice = totalPrice + priceDifference;
    state.xyDatasets.push({
      x: date,
      y: newTotalPrice,
      cardId, // Keeping cardId here for any reference you might need.
    });

    const chartDataCollectionScope = {
      userId: userId,
      chartId: '',
      name: `Dataset ${state?.totalY?.length + 1}`,
      datasets: state.totalY,
    };

    // Calculate the total y value and add it to yUpdateDataset
    const totalY = state.xyDatasets.reduce((acc, dataPoint) => acc + dataPoint.y, 0);
    state.yUpdateDataset = [
      {
        x: date,
        y: totalY,
        collectionId,
      },
    ];

    // const chartDataCardScope = {
    //   userId: '',
    //   chartId: '',
    //   name: `Dataset ${state.xyDatasets.length + 1}`,
    //   datasets: state.xyDatasets,
    // };
    const chartData = new ChartData({ chartDataCollectionScope });

    await chartData.save();

    console.log('XY DATESETS', state.xyDatasets);
    console.log('Y UPDATE DATASET', state.yUpdateDataset); // Log the yUpdateDataset
  }
};

const updateCardPrice = async (card, cardInfo, userId, collectionId) => {
  // added userId and collectionId as parameters
  if (!validateCardData(card) || !validateCardData(cardInfo)) {
    return null;
  }
  console.log('updatecardpriceuserid', userId);
  const initialPrice = card.card_prices[0]?.tcgplayer_price;
  const updatedPrice = cardInfo.card_prices[0]?.tcgplayer_price || 'Price not available';
  const cardQuantity = typeof card.quantity === 'number' ? card.quantity : 1;
  const totalCardPrice = updatedPrice * cardQuantity;
  const todayDate = new Date();
  const user = 

  await generateXYdatasets(
    userId,
    collectionId,
    card._id,
    initialPrice,
    updatedPrice,
    totalCardPrice,
    todayDate,
  ); // updated cardId parameter

  const priceDifference = initialPrice - updatedPrice;
  if (priceDifference !== 0) {
    cardPriceUpdates[card._id] = {
      id: card.id,
      previousPrices: card.card_prices[0],
      updatedPrices: { tcgplayer_price: updatedPrice },
      priceDifference,
    };
    console.log('userId', userId);

    datasets.push({
      x: new Date(),
      y: totalCardPrice,
    });
    console.log('userId', userId);
    try {
      await ChartData.create({
        name: `Chart for Card ID: ${card?._id}`,
        userId: userId,
        chartId: collectionId, // assuming you want to reference the collection ID as chartId here
        datasets: [
          {
            x: todayDate,
            y: updatedPrice, // or totalCardPrice, whichever you want to track
          },
        ],
      });
    } catch (err) {
      console.error('Error creating ChartData:', err.message);
    }
    await user.allDatasets.save()
    datasets.length = 0; // Reset the datasets array
    console.log('ChartData', ChartData);

    return { updatedPrices: { tcgplayer_price: updatedPrice }, totalCardPrice };
  }
};
// const posOrNeg = priceDifference < 0 ? `${priceDifference}`.red : `${priceDifference}`.green;
// console.log('updatedPrices', updatedPrices);

const logCardUpdate = (card, cardId, itemType, updatedPrices, initialPrice, priceDifference) => {
  const posOrNeg =
    typeof priceDifference === 'number'
      ? priceDifference < 0
        ? `${priceDifference}`.red
        : `${priceDifference}`.green
      : 'Invalid Price Difference'.red;

  console.log(
    `Data for card ${card?.name ?? 'Unknown'} (ID: ${cardId}) in ${itemType}: `,
    'Initial Prices: ' + `${initialPrice ?? 'Unknown'}`.yellow,
    'Updated Prices: ' + `${updatedPrices?.tcgplayer_price ?? 'Unknown'}`.green,
    'Price Difference: ' + `${posOrNeg}`.white,
  );
};

const updateCardsInItem = async (item, userId, collectionId) => {
  // added userId and collectionId as parameters
  const itemType = item.constructor.modelName;
  let allPrices = [];
  let totalPrice = 0; // Initialize totalPrice here to keep track of overall total

  console.log('userId', userId);
  setUserId(userId);
  const cards = Array.isArray(item.cards)
    ? item.cards
    : Array.isArray(item.cart?.cards)
    ? item.cart.cards
    : [];

  for (const card of cards) {
    const cardId = card.id;

    if (!cardId) {
      console.warn(`Card ID missing for ${itemType}: ${card.name}`);
      continue;
    }

    const cardInfo = await getCardInfo(cardId);
    // console.log('past updateCardPrice has been reacheed', cardInfo);

    if (!cardInfo) {
      console.warn(`Card info not found for ${itemType} (ID: ${cardId}): ${card.name}`);
      continue;
    }
    console.log('past updateCardPrice has been reacheed', userId);

    const { updatedPrices, totalCardPrice } = await updateCardPrice(
      card,
      cardInfo,
      userId,
      collectionId,
    ); // added userId and collectionId as arguments
    console.log('past updateCardPrice has been reacheed', updatedPrices);
    console.log('past updateCardPrice has been reacheed', userId);

    // Make sure that totalCardPrice is a number and greater than or equal to 0 before adding it to totalPrice
    if (!isNaN(totalCardPrice) && totalCardPrice >= 0) {
      totalPrice += totalCardPrice;
    }
  }

  allPrices.push(totalPrice);
  console.log('allPrices', allPrices);
  console.log('totalPrice', totalPrice);
  return totalPrice;
};
const updateItemsInCollection = async (collection) => {
  try {
    const updatedItems = await Promise.all(
      collection.items.map(async (item) => {
        const response = await instance.get(`/cardinfo.php?id=${item._id}`);
        console.log('response.data', response.data);
        const updatedItemInfo = response.data.card_info;
        console.log('updatedItemInfo', updatedItemInfo);
        return {
          ...item,
          price: updatedItemInfo.price,
          updatedAt: new Date(),
        };
      }),
    );
    collection.items = updatedItems;
    console.log('updateditems', updatedItems);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const updateCollections = async (user) => {
  const io = getIO();
  console.log('user', user);
  try {
    if (!Array.isArray(user?.allCollections)) return;

    for (const collectionId of user.allCollections) {
      const collection = await Collection.findById(collectionId);
      if (!collection) continue;

      // Ensure cards are updated
      const totalPrice = await updateCardsInItem(collection);

      // Save the updated totalPrice to collection
      collection.totalPrice = totalPrice;

      await collection.save();

      const newCollectionData = {
        userId: user._id,
        collectionData: {
          userId: collection?.userId,
          totalPrice: collection.totalPrice,
          // The other fields...
        },
      };

      io.emit('RECEIVE_S2S_COLLECTION_UPDATE', { newCollectionData });
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  // getChartData,
  // updateChartData,
  generateXYdatasets,
  getCardPriceHistory,
  // handleChartDataCreation,
  updateCardsInItem,
  getCardInfo,
  updateCollections,
  updateItemsInCollection,
  updateCardPrice,
  logCardUpdate,
};
