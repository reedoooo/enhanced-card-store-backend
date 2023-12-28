const axios = require('axios');
const User = require('../../models/User');
const CardInCollection = require('../../models/CardInCollection');
const { logData, logError } = require('../../utils/loggingUtils');
const CardInDeck = require('../../models/CardInDeck');
const CustomError = require('../../middleware/customError');
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
      const fetchedCards = response?.data?.data?.slice(0, 90); // Limiting to 30 cards

      logData(fetchedCards[0]);
      const transformedCards = fetchedCards?.map((card) => {
        const tcgplayerPrice = card?.card_prices[0]?.tcgplayer_price || 0;
        let card_set = null;
        if (card?.card_sets && card?.card_sets?.length > 0) {
          card_set = card?.card_sets[0];
        }
        const rarity = card_set?.set_rarity || '';
        return {
          // custom data
          image: card?.card_images.length > 0 ? card.card_images[0].image_url : '',
          quantity: 0,
          price: tcgplayerPrice,
          totalPrice: 0,
          tag: '',
          collectionId: '',
          watchList: false,
          rarity: rarity,
          card_set: card_set ? card_set : {},
          chart_datasets: [
            {
              x: Date.now(),
              y: tcgplayerPrice,
            },
          ],
          lastSavedPrice: {
            num: tcgplayerPrice,
            timestamp: Date.now(),
          },
          latestPrice: {
            num: tcgplayerPrice,
            timestamp: Date.now(),
          },
          dataOfLastPriceUpdate: Date.now(),
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

          // preset data
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
          card_sets: card.card_sets,
          card_images: card.card_images,
          card_prices: card.card_prices,
        };
      });

      return transformedCards;
    } catch (error) {
      console.error('Error fetching card information:', error);
      logError(
        'Error fetching card information:',
        error?.response?.statusText,
        error?.response?.data,
        {
          source: 'cardController.fetchAndTransformCardData',
        },
      );
      throw error; // Propagate the error
    }
  },

  updateExistingCardInUserCollection: async (userId, collectionId, cardUpdates) => {
    try {
      if (!Array.isArray(cardUpdates)) {
        throw new Error('Card updates should be an array');
      }

      const user = await User.findById(userId).populate({
        path: 'allCollections',
        populate: { path: 'cards' },
      });

      if (!user) throw new Error('User not found');

      const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);

      if (!collection) throw new Error('Collection not found');

      for (const update of cardUpdates) {
        if (typeof update === 'string') {
          console.log('Skipping card update:', update);
          continue;
        }

        if (typeof update === 'object' && update !== null && update.id) {
          const cardIndex = collection.cards.findIndex((card) => card.id.toString() === update.id);
          if (cardIndex !== -1) {
            const card = collection.cards[cardIndex];
            update.collectionId = collection?._id;
            console.log(`UPDATING CARD: ${card?.name} in collection ${collection}`);
            Object.assign(card, update);
            await CardInCollection.findByIdAndUpdate(card?._id, update);
          } else {
            // Add new card to the collection
            update.collectionId = collection?._id;
            const newCard = new CardInCollection(update);
            console.log('ADDING NEW CARD:', newCard?.name);
            await newCard.save();
            collection.cards.push(newCard);
          }
        } else {
          throw new Error('Invalid card data in update array');
        }
      }

      // Save and re-populate the updated collection
      await collection.save();
      user.markModified('allCollections');
      await user.save();

      // Re-fetch and re-populate the specific collection to get updated cards
      const updatedCollection = await user.allCollections
        .find((c) => c._id.toString() === collectionId)
        .populate('cards');

      return { message: 'Collection updated successfully', cards: updatedCollection.cards };
    } catch (error) {
      console.error('Error updating card in collection:', error);
      throw error; // Re-throw the error for further handling
    }
  },
  removeCardsFromUserCollection: async (userId, collectionId, updatedCards) => {
    if (!Array.isArray(updatedCards)) {
      throw new Error('Invalid card updates array');
    }

    try {
      let user = await User.findById(userId).populate({
        path: 'allCollections',
        populate: { path: 'cards' },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const collection = user.allCollections.find((c) => c._id.toString() === collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      for (const update of updatedCards) {
        const cardIndex = collection.cards.findIndex((card) => card.id.toString() === update.id);
        if (cardIndex !== -1) {
          const currentCard = collection.cards[cardIndex];

          if (currentCard.quantity > 1) {
            // Decrement the quantity of the card in the collection
            currentCard.quantity -= 1;
            await CardInCollection.findByIdAndUpdate(currentCard._id, {
              quantity: currentCard.quantity,
            });
          } else {
            // Remove the card from the collection if quantity is 1 or less
            await CardInCollection.findByIdAndRemove(currentCard._id);
            collection.cards.splice(cardIndex, 1);
          }
        }
      }

      await collection.save();

      // Re-fetch the specific collection to get updated cards
      user = await User.findById(userId).populate({
        path: 'allCollections',
        populate: { path: 'cards' },
      });

      const updatedCollection = user.allCollections.find((c) => c._id.toString() === collectionId);

      return {
        message: 'Collection updated successfully',
        cards: updatedCollection.cards, // Returning only the cards of the updated collection
      };
    } catch (error) {
      console.error('Error in removeCardsFromUserCollection:', error);
      throw error;
    }
  },

  addCardToUserDeck: async (userId, deckId, newCard) => {
    try {
      if (!newCard || !newCard[0]?.id || !newCard[0]?.name) {
        throw new Error('Card data is incomplete. Both id and name are required.');
      }
      // Fetch the user and populate allDecks and their cards
      let user = await User.findById(userId).populate({
        path: 'allDecks',
        populate: { path: 'cards' },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Find the specific deck within user's allDecks
      const deck = user.allDecks.find((d) => d._id.toString() === deckId);
      if (!deck) {
        throw new Error('Deck not found');
      }

      // Check if the card already exists in the deck
      const existingCardIndex = deck.cards.findIndex((c) => c.id.toString() === newCard[0].id);
      if (existingCardIndex !== -1) {
        // Card already exists in the deck, update its quantity
        deck.cards[existingCardIndex].quantity += 1;
        await CardInDeck.findByIdAndUpdate(deck.cards[existingCardIndex]._id, {
          quantity: deck.cards[existingCardIndex].quantity,
        });
      } else {
        // Card does not exist in the deck, add it as a new card
        const cardToAdd = new CardInDeck({
          ...newCard[0],
          quantity: Math.max(1, newCard[0].quantity || 1),
          deck: deck._id,
        });
        await cardToAdd.save();
        deck.cards.push(cardToAdd._id);
      }

      await deck.save();

      await user.save();

      // Re-fetch user to get updated allDecks with populated cards
      user = await User.findById(userId).populate({
        path: 'allDecks',
        populate: { path: 'cards' },
      });

      return { message: 'Card added to deck successfully', allDecks: user.allDecks };
    } catch (error) {
      console.error('Error in addCardToUserDeck:', error);
      throw error;
    }
  },
  updateExistingCardInUserDeck: async (userId, deckId, cardUpdates) => {
    try {
      // Fetch the user and populate allDecks and their cards
      let user = await User.findById(userId).populate({
        path: 'allDecks',
        populate: { path: 'cards' },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Find the specific deck within user's allDecks
      let deck = user.allDecks.find((d) => d._id.toString() === deckId);
      if (!deck) {
        throw new Error('Deck not found');
      }

      if (!Array.isArray(cardUpdates)) {
        throw new Error('Invalid cards array in deck');
      }

      for (const update of cardUpdates) {
        const cardIndex = deck.cards.findIndex((card) => card.id.toString() === update.id);

        if (cardIndex !== -1) {
          const card = deck.cards[cardIndex];

          if (update.quantity && update.quantity <= 0) {
            // Remove card from the deck if quantity is 0 or less
            deck.cards.splice(cardIndex, 1);
            await CardInDeck.findByIdAndRemove(card._id);
          } else {
            // Update card with minimum quantity of 1
            for (const key in update) {
              card[key] = key === 'quantity' ? Math.max(1, update[key]) : update[key];
            }
            card.deck = deck._id;
            // Save the updated card
            await CardInDeck.findByIdAndUpdate(card._id, card);
          }
        } else {
          // Add new card with minimum quantity of 1
          const newCard = new CardInDeck({
            ...update,
            deckId: deck._id,
            quantity: Math.max(1, update.quantity || 1),
            deck: deck._id,
          });
          await newCard.save();
          deck.cards.push(newCard._id);
        }
      }

      // Refresh the deck's cards array
      await deck.populate('cards');

      // Since we've modified a subdocument (cards in deck), we need to mark it as modified
      // user.markModified('allDecks');
      await user.save();

      // Re-fetch the user to get updated deck
      user = await User.findById(userId).populate({
        path: 'allDecks',
        populate: { path: 'cards' },
      });

      // Find the updated deck again
      deck = user.allDecks.find((d) => d._id.toString() === deckId);

      return { message: 'Deck updated successfully', deck };
    } catch (error) {
      console.error('Error in updateExistingCardInUserDeck:', error);
      throw error;
    }
  },
  removeCardsFromUserDeck: async (userId, deckId, updatedCards) => {
    if (!Array.isArray(updatedCards)) {
      throw new Error('Invalid card updates array');
    }
    try {
      let user = await User.findById(userId).populate({
        path: 'allDecks',
        populate: { path: 'cards' },
      });
      if (!user) {
        throw new Error('User not found');
      }

      const deck = user.allDecks.find((d) => d._id.toString() === deckId);
      if (!deck) {
        throw new Error('Deck not found');
      }

      for (const update of updatedCards) {
        const cardIndex = deck.cards.findIndex((card) => card.id.toString() === update.id);
        if (cardIndex !== -1) {
          const currentCard = deck.cards[cardIndex];
          if (update.quantity <= 0) {
            // Remove the card from the deck and the CardInDeck model
            await CardInDeck.findByIdAndRemove(currentCard._id);
            deck.cards.splice(cardIndex, 1);
          } else {
            // Decrement the quantity of the card in the deck
            currentCard.quantity = Math.max(0, currentCard.quantity - 1);
            await CardInDeck.findByIdAndUpdate(currentCard._id, { quantity: currentCard.quantity });
          }
        }
      }

      await deck.save();

      // Re-fetch user to get updated allDecks with populated cards
      user = await User.findById(userId).populate({
        path: 'allDecks',
        populate: { path: 'cards' },
      });
      return { message: 'Deck updated successfully', allDecks: user.allDecks };
    } catch (error) {
      console.error('Error in removeCardsFromUserDeck:', error);
      throw error;
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
