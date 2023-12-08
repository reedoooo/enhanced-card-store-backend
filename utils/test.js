const { updateExistingCardInUserCollection } = require('../controllers/CardController');
const User = require('../models/User');
const { logData, logError, logPriceChange } = require('./loggingUtils');
const { getCardInfo } = require('./utils');

// Function to check for price updates
const checkAndUpdateCardPrices = async (selectedList, io) => {
  try {
    let priceUpdates = [];

    for (const card of selectedList) {
      const latestCardInfo = await getCardInfo(card.id);
      const latestPrice = parseFloat(latestCardInfo.card_prices[0]?.tcgplayer_price || 0);

      // console.log('LATEST PRICE', latestPrice);
      if (latestPrice !== card.latestPrice.num) {
        logPriceChange('CHANGE', card, latestPrice, card.latestPrice.num);

        priceUpdates.push({
          cardId: card.id,
          oldPrice: card.latestPrice.num,
          newPrice: latestPrice,
        });
      }
      if (latestPrice === card.latestPrice.num) {
        logPriceChange('NO_CHANGE', card, latestPrice, card.latestPrice.num);
      }
    }

    if (priceUpdates?.length > 0) {
      await updateCollectionsWithNewCardValues(selectedList, io);
    } else {
      console.log('NO_CARD_PRICE_CHANGE');
      io.emit('CARD_PRICES_UNCHANGED', {
        message: 'Card prices remain unchanged',
        currentPrices: selectedList,
      });
    }
    return priceUpdates;
  } catch (error) {
    console.error('Error in checkAndUpdateCardPrices:', error);
    logError(error, error.message, null, {
      source: 'checkAndUpdateCardPrices',
    });
    throw error;
  }
};

const updateCollectionsWithNewCardValues = async (userId, updatedCards, io) => {
  try {
    // Fetch the user and populate allCollections and their cards
    let user = await User.findById(userId).populate({
      path: 'allCollections',
      populate: { path: 'cards' },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Group the updated cards by their collectionId
    const cardsGroupedByCollection = updatedCards.reduce((acc, card) => {
      acc[card.collectionId] = acc[card.collectionId] || [];
      acc[card.collectionId].push(card);
      return acc;
    }, {});

    // Update each collection with its corresponding card updates
    for (const collectionId in cardsGroupedByCollection) {
      const cardUpdates = cardsGroupedByCollection[collectionId];
      await updateExistingCardInUserCollection(userId, collectionId, cardUpdates);
    }

    // Repopulate the user's allCollections and their cards
    user = await User.findById(userId).populate({
      path: 'allCollections',
      populate: { path: 'cards' },
    });

    // Collect updated cards across all collections
    const updatedCardsAcrossCollections = user.allCollections.reduce((acc, collection) => {
      acc.push(...collection.cards);
      return acc;
    }, []);

    io.emit('COLLECTIONS_UPDATED', {
      message: 'All collections updated successfully',
      updatedCards: updatedCardsAcrossCollections,
    });
  } catch (error) {
    console.error('Error in updateCollectionsWithNewCardValues:', error);
    logError(error, error.message, null, {
      data: updatedCards,
      source: 'checkAndUpdateCardPrices',
    });
    throw error;
  }
};

module.exports = {
  updateCollectionsWithNewCardValues,
  checkAndUpdateCardPrices,
};
