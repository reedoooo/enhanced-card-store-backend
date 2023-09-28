const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const axios = require('axios');
const Collection = require('../../models/Collection');
const Deck = require('../../models/Deck');
const colors = require('colors');

const instance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

const cardPriceUpdates = {};
const numberOfCronJobRuns = 5;
let totalDeckPrice = 0;
let totalCollectionPrice = 0;
let cronJobRunCounter = 0;
let isCronJobRunning = false;
let allDeckData = [];
let allCollectionData = [];
let allItemTypeData = {};

const updateCardsInItem = async (item) => {
  const itemType = item.constructor.modelName;
  const specificItemType = item.name;

  const collections = await Collection.find().populate('cards');
  const decks = await Deck.find().populate('cards');
  const allItems = [...collections, ...decks];

  let overallTotalPrice = 0;
  const totalItemsInItemType = allItems.filter((item) => item.constructor.modelName === itemType);

  let allItemPrices = [];
  for (const card of item.cards) {
    const cardPrice = card.card_prices[0]?.tcgplayer_price || 0;
    const itemPrice = {
      item: card.name,
      price: cardPrice,
      totalPriceOfItem: cardPrice * card.quantity,
    };
    allItemPrices.push(itemPrice);
  }

  let totalPrice = 0;
  for (const card of item.cards) {
    const cardId = card.id;
    if (!cardId) continue;

    const response = await instance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    const cardInfo = response.data.data[0];
    if (!cardInfo) continue;

    const initialPrice = parseFloat(card.card_prices[0]?.tcgplayer_price || 0);
    const updatedPrice = parseFloat(cardInfo.card_prices[0]?.tcgplayer_price || 0);
    const priceDifference = updatedPrice - initialPrice;

    if (!isNaN(updatedPrice) && updatedPrice >= 0) {
      const cardTotalPrice = updatedPrice * card.quantity;
      totalPrice += cardTotalPrice;
      overallTotalPrice += totalPrice;
      totalCollectionPrice += allItemPrices.reduce((acc, item) => acc + item.totalPriceOfItem, 0);
    }

    console.log(
      (
        `Updated prices for card ${card.name.red} (ID: ${cardId}) in ${itemType.red} ` +
        `${specificItemType.red} ${updatedPrice.toFixed(2).red}`
      ).white,
      ('Initial Price: ' + `${initialPrice}`.red).white,
      ('UPDATED PRICE: ' + `${updatedPrice.toFixed(2)}`.green).white,
      ('PRICE DIFFERENCE: ' + `${priceDifference.toFixed(2)}`.cyan).white,
      ('Quantity: ' + `${card.quantity}`.red).white,
      (
        'Total Quantity: ' +
        `${allItemPrices.find((item) => item.item === card.name)?.quantity || 0}`.red
      ).white,
      ('Total Price: ' + `${totalPrice.toFixed(2)}`.red).white,
      ('OVERALL Total Price: ' + `${overallTotalPrice}`.green).white,
      ('Total Collection Price: ' + `${totalCollectionPrice.toFixed(2)}`.green).white,
    );

    if (initialPrice !== updatedPrice) {
      cardPriceUpdates[cardId] = {
        id: cardId,
        previousPrices: initialPrice.toFixed(2),
        updatedPrices: updatedPrice.toFixed(2),
        priceDifference: (updatedPrice - initialPrice).toFixed(2),
      };
    }
  }

  const specificItemData = {
    itemPrice: {
      item: specificItemType,
      price: totalPrice,
      totalPriceOfItem: overallTotalPrice,
    },
    itemQuantity: {
      item: specificItemType,
      quantity: item.cards.length,
    },
    collectionTotal: {
      totalPrice: totalCollectionPrice,
    },
  };

  if (itemType === 'Collection') {
    allCollectionData.push({
      itemType,
      specificItemType,
      allItemQuantities: allItemPrices.map((item) => ({
        item: item.item,
        quantity: item.quantity,
      })),
      allItemPrices,
      totalPrice,
      specificItemData,
    });
  } else {
    allDeckData.push({ specificItemData, totalPrice });
  }

  allItemTypeData = {
    allCollectionData,
    allDeckData,
    totalItems: allItems.length,
    totalItemsInItemType,
  };

  return allItemTypeData;
};

const cronJob = async (item) => {
  if (isCronJobRunning) return;

  isCronJobRunning = true;

  try {
    cronJobRunCounter++;
    const collections = await Collection.find().populate('cards');
    const decks = await Deck.find().populate('cards');
    const allItems = [...collections, ...decks];

    totalDeckPrice = 0;
    totalCollectionPrice = 0;

    for (const item of allItems) {
      const allItemTypeData = await updateCardsInItem(item);
      const itemType = item.constructor.modelName;

      console.log('allItemTypeData:', allItemTypeData.allCollectionData);
      const { totalPrice } = allItemTypeData;
      await item.save();

      if (item.constructor.modelName === 'Collection') {
        totalCollectionPrice += totalPrice;
      } else {
        totalDeckPrice += totalPrice;
      }
    }

    if (cronJobRunCounter >= numberOfCronJobRuns) {
      cronTask.stop();
    }
    isCronJobRunning = false;
  } catch (error) {
    console.error(error.message.red);
    isCronJobRunning = false;
  }
};

const cronTask = cron.schedule('*/10 * * * *', cronJob);

const stopAndResetCronJob = () => {
  if (isCronJobRunning) {
    cronTask.stop();
    isCronJobRunning = false;
  }
  cronJobRunCounter = 0;
};

const updateSpecificItem = async (req, res) => {
  const { itemType, itemId } = req.params;

  try {
    let item =
      itemType === 'Collection'
        ? await Collection.findById(itemId).populate('cards')
        : await Deck.findById(itemId).populate('cards');

    if (!item) {
      return res.status(400).json({ error: 'Invalid item type.' });
    }

    const updatedTotalPrice = await updateCardsInItem(item);
    item.totalPrice = updatedTotalPrice;
    await item.save();

    res.status(200).json({ updatedTotalPrice });
  } catch (error) {
    console.error(`Error updating ${itemType}: ${error}`.red);
    res.status(500).json({ error: `Error updating ${itemType}.` });
  }
};

const getTotalCardPrice = () => {
  return Object.values(cardPriceUpdates)
    .reduce((sum, { updatedPrices }) => sum + parseFloat(updatedPrices || 0), 0)
    .toFixed(2);
};

router.get('/update', async (req, res) => {
  try {
    await cronJob();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    res.status(200).json({
      changedCards: Object.values(cardPriceUpdates),
      totalCardPrice: getTotalCardPrice(),
      totalDeckPrice: totalDeckPrice.toFixed(2),
      totalCollectionPrice: totalCollectionPrice.toFixed(2),
      totalRuns: Object.values(cardPriceUpdates).length,
      allCollectionData,
      allDeckData,
      allItemTypeData,
    });
  } catch (error) {
    console.error(error.message.red);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stopAndReset', (req, res) => {
  stopAndResetCronJob();
  res.status(200).json({ message: 'Cron job stopped.' });
});

router.get('/update/:itemType/:itemId', updateSpecificItem);

module.exports = router;
