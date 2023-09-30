// Imports
const axios = require('axios');
const Collection = require('../../models/Collection');
const Deck = require('../../models/Deck');
const {
  saveNewChartData,
  getUserById,
  finalizeItemData,
  initializeVariables,
} = require('./chartDataLayer');
const ChartData = require('../../models/ChartData');
const socket = require('../../socket');

// Axios instance creation
const instance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

const cardPriceUpdates = {};
const getCardInfo = async (cardId) => {
  try {
    const response = await instance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    return response.data.data[0];
  } catch (error) {
    console.error('Error fetching card info: ', error);
    return null;
  }
};

const updateCardPrice = (card, cardInfo) => {
  const initialPrices = card.card_prices[0];
  const updatedPrices = {
    tcgplayer_price: cardInfo.card_prices[0]?.tcgplayer_price || 'Price not available',
  };

  const priceDifference = initialPrices - updatedPrices;

  if (priceDifference !== 'No change') {
    cardPriceUpdates[card._id] = {
      id: card.id,
      previousPrices: card.card_prices[0],
      updatedPrices,
      priceDifference,
    };
  }

  card.card_prices[0] = updatedPrices;
  return updatedPrices;
};

const logCardUpdate = (card, cardId, itemType, updatedPrices, initialPrices, priceDifference) => {
  console.log(
    `Updated prices for card ${card.name} (ID: ${cardId}) in ${itemType}: ${updatedPrices}`,
    `Initial prices: ${initialPrices}`,
    `Price difference: ${priceDifference}`,
  );
};

const updateCardsInItem = async (item) => {
  const itemType = item.constructor.modelName;
  let totalPrice = 0;

  for (const card of item.cards || item.cart.cards) {
    const cardId = card.id;

    if (!cardId) {
      console.warn(`Card ID missing for ${itemType}: ${card.name}`);
      continue;
    }

    const cardInfo = await getCardInfo(cardId);

    if (!cardInfo) {
      console.warn(`Card info not found for ${itemType} (ID: ${cardId}): ${card.name}`);
      continue;
    }

    const updatedPrices = updateCardPrice(card, cardInfo);
    const initialPrices = card.card_prices[0];
    const priceDifference = initialPrices - updatedPrices;

    logCardUpdate(card, cardId, itemType, updatedPrices, initialPrices, priceDifference);

    // const priceMultiplier = itemType === 'Collection' ? 2 : 1; // Double the price for collections

    const updatedPriceValue = parseFloat(updatedPrices.tcgplayer_price);
    if (!isNaN(updatedPriceValue) && updatedPriceValue >= 0) {
      totalPrice += updatedPriceValue;
    }
  }

  return totalPrice;
};

const updateItemsInCollection = async (collection) => {
  try {
    const updatedItems = await Promise.all(
      collection.items.map(async (item) => {
        const response = await instance.get(`/cardinfo.php?id=${item._id}`);
        const updatedItemInfo = response.data.card_info;
        return {
          ...item,
          price: updatedItemInfo.price,
          updatedAt: new Date(),
        };
      }),
    );
    collection.items = updatedItems;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const updateCollections = async (user) => {
  try {
    if (!Array.isArray(user.collections)) return;

    await Promise.all(
      user.collections.map(async (collectionId) => {
        const collection = await Collection.findById(collectionId);
        if (!collection) return;

        await updateItemsInCollection(collection);
        await collection.save();

        // console.log('collection', collection);
        const name = collection.name || `ChartData #${user.allDataSets.length + 1}`;
        await saveNewChartData(
          name,
          {
            x: collection.createdAt,
            y: collection.totalPrice,
          },
          user._id,
        );
      }),
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// New function: updateChartData
const updateChartData = async (chartId, updatedValues, userId) => {
  try {
    const existingChartData = await ChartData.findById(chartId);
    if (!existingChartData) throw new Error('Chart data not found.');
    if (existingChartData.userId.toString() !== userId.toString())
      throw new Error('Unauthorized operation.');

    existingChartData.collectionData = updatedValues.uniqueCollectionData;
    existingChartData.deckData = updatedValues.uniqueDeckData;
    existingChartData.allData = [
      ...updatedValues.uniqueCollectionData,
      ...updatedValues.uniqueDeckData,
    ];
    existingChartData.allUpdatedPrices = updatedValues.returnValue?.allUpdatedPrices;
    existingChartData.cronData = {
      ...existingChartData.cronData,
      totalJobs: updatedValues.returnValue?.totalRuns,
    };
    const io = socket.getIO();

    await existingChartData.save();
    console.log('Emitting data to clients:', existingChartData);
    console.log('Emitting data to clients:', { data: existingChartData });
    io.emit('returnvalue', { data: existingChartData });
    return existingChartData;
  } catch (error) {
    console.error('Error updating chart data:', error);
    throw error;
  }
};

// Exports
module.exports = {
  updateChartData,
  updateCardsInItem,
  getCardInfo,
  updateCollections,
  updateItemsInCollection,
  updateCardPrice,
  logCardUpdate,
};
