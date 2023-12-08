const express = require('express');
const router = express.Router();
// const Card = require('../models/Card');
const axios = require('axios');
const User = require('../models/User');
const Collection = require('../models/Collection');
const CardInCollection = require('../models/CardInCollection');
const { logError, logData } = require('../utils/loggingUtils');
const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});

function queryBuilder(name, race, type, level, attribute) {
  const queryParts = [];

  if (name) queryParts.push(`fname=${encodeURIComponent(name)}`);
  if (race) queryParts.push(`race=${encodeURIComponent(race)}`);
  if (type) queryParts.push(`type=${encodeURIComponent(type)}`);
  if (level) queryParts.push(`level=${encodeURIComponent(level)}`);
  if (attribute) queryParts.push(`attribute=${encodeURIComponent(attribute)}`);

  return queryParts.join('&');
}
const cardController = {
  getAllCards: async () => {
    let cards = await CardInCollection.find({}).limit(30);

    if (cards.length === 0) {
      await cardController.getCardsFromApi();
      cards = await CardInCollection.find({}).limit(30);
    }

    return cards;
  },

  getCardById: async (id) => {
    return await CardInCollection.findOne({ id: id });
  },

  getCardByType: async (type) => {
    return await CardInCollection.find({ type: type });
  },

  getCardByAttribute: async (attribute) => {
    return await CardInCollection.find({ attribute: attribute });
  },

  getCardByName: async (name) => {
    return await CardInCollection.findOne({ name: name });
  },

  getCardsFromApi: async () => {
    try {
      const response = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php');
      const fetchedCards = response.data.data.slice(0, 30); // Limiting to 30 cards

      // Get IDs of fetched cards
      const fetchedCardIds = fetchedCards.map((card) => card.id);

      // Find which of these cards already exist in the database
      const existingCards = await CardInCollection.find({ id: { $in: fetchedCardIds } });
      const existingCardIds = new Set(existingCards.map((card) => card.id));

      // Filter out cards that already exist
      const newCards = fetchedCards.filter((card) => !existingCardIds.has(card.id));

      // Create new card documents
      const newCardDocuments = newCards.map(
        (card) =>
          new CardInCollection({
            id: card.id,
            name: card.name,
            type: card.type,
            frameType: card.frameType,
            desc: card.desc,
            atk: card.atk,
            def: card.def,
            level: card.level,
            race: card.race,
            attribute: card.attribute,
            card_images: card.card_images,
            image: card.card_images[0].image_url,
            card_prices: card.card_prices,
          }),
      );

      // Insert all new cards in a single operation
      await CardInCollection.insertMany(newCardDocuments);
    } catch (error) {
      console.error('Error fetching data from the API: ', error);
    }
  },
  fetchAndTransformCardData: async (name, race, type, level, attribute) => {
    try {
      const response = await axiosInstance.get(
        `/cardinfo.php?${queryBuilder(name, race, type, level, attribute)}`,
      );
      const fetchedCards = response.data.data.slice(0, 90); // Limiting to 30 cards

      const transformedCards = fetchedCards.map((card) => {
        const tcgplayerPrice = card.card_prices[0]?.tcgplayer_price || 0;

        return {
          id: card.id.toString(),
          name: card.name,
          type: card.type,
          frameType: card.frameType,
          desc: card.desc,
          atk: card.atk,
          def: card.def,
          level: card.level,
          race: card.race,
          attribute: card.attribute,
          archetype: [], // Assuming logic to determine this
          image: card.card_images.length > 0 ? card.card_images[0].image_url : '',
          card_sets: card.card_sets,
          card_images: card.card_images,
          card_prices: card.card_prices,
          quantity: 0,
          price: tcgplayerPrice,
          totalPrice: 0,
          lastSavedPrice: {
            num: tcgplayerPrice,
            timestamp: Date.now(),
          },
          latestPrice: {
            num: tcgplayerPrice,
            timestamp: Date.now(),
          },
          priceHistory: [
            {
              num: tcgplayerPrice,
              timestamp: Date.now(),
            },
          ],
          dailyPriceHistory: [
            {
              num: tcgplayerPrice,
              timestamp: Date.now(),
            },
          ],
          // Add other fields and transformations as needed
        };
      });

      return transformedCards;
    } catch (error) {
      console.error('Error fetching card information:', error);
      throw error; // Propagate the error
    }
  },
  updateExistingCardInUserCollection: async (userId, collectionId, cardUpdates) => {
    try {
      // Fetch the user and populate allCollections and their cards
      const user = await User.findById(userId).populate({
        path: 'allCollections',
        populate: { path: 'cards' },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Find the specific collection within user's allCollections
      const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      if (!Array.isArray(cardUpdates)) {
        throw new Error('Invalid cards array in collection');
      }

      // Loop through the card updates
      for (const update of cardUpdates) {
        const cardIndex = collection.cards.findIndex((card) => card.id.toString() === update.id);
        if (cardIndex !== -1) {
          // Update existing card in the collection
          const card = collection.cards[cardIndex];
          for (const key in update) {
            card[key] = update[key];
          }

          // Update existing card in the database
          await CardInCollection.findByIdAndUpdate(card._id, update);
        } else {
          // Add new card
          const newCard = new CardInCollection(update);
          await newCard.save();
          collection.cards.push(newCard._id); // Ensure you're pushing the _id
        }
      }

      // Refresh the collection's cards array
      await collection.populate('cards');

      // Since we've modified a subdocument (cards in collection), we need to mark it as modified
      user.markModified('allCollections');
      await user.save();

      return { message: 'Collection updated successfully', cards: collection.cards };
    } catch (error) {
      console.error('Error in updateExistingCardInUserCollection:', error);
      throw error;
    }
  },

  updateCardInCollection: async (cardId, cardData) => {
    try {
      const updatedCard = await CardInCollection.findOneAndUpdate({ id: cardId }, cardData, {
        new: true,
      });
      return updatedCard;
    } catch (error) {
      console.error('Error updating card in collection:', error);
      throw error; // Propagate the error
    }
  },

  deleteCardFromCollection: async (cardId) => {
    try {
      const deleteResult = await CardInCollection.deleteOne({ id: cardId });
      return deleteResult.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting card from collection:', error);
      throw error; // Propagate the error
    }
  },

  patchCard: async (cardId, cardData) => {
    // Implement the logic to update the card
    try {
      const user = await User.findById(cardData.userId).populate('allCollections');
      if (!user) {
        throw new Error(`User not found: ${user?.id}`);
      }

      let updatedCardInfo = null;
      user.allCollections.forEach((collection) => {
        const cardIndex = collection.cards.findIndex((card) => card.id === cardId);
        if (cardIndex !== -1) {
          collection.cards[cardIndex] = {
            ...collection.cards[cardIndex],
            ...cardData, // Update with the provided card data
          };
          updatedCardInfo = collection.cards[cardIndex];
        }
      });

      await Promise.all(user.allCollections.map((collection) => collection.save()));

      return updatedCardInfo;
    } catch (error) {
      console.error('Error updating card:', error);
      throw error; // Propagate the error
    }
  },
};

module.exports = cardController;
