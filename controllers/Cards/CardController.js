const axios = require('axios');
const User = require('../../models/User');
const { CardInCollection, CardInDeck, CardInSearch } = require('../../models/Card');
const { queryBuilder, fetchCardPrices } = require('./helpers');
const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});
const cardController = {
  fetchPriceData: async (cardName) => {
    try {
      const card_prices = await fetchCardPrices(cardName);
      console.log('CARD PRICES:', card_prices);
      return card_prices;
    } catch (error) {
      console.error('Error fetching card prices:', error);
      throw error;
    }
  },
  /**
   * Fetches card data from the API and transforms it into CardInSearch instances.
   * @param {*} userId
   * @param {*} label
   * @param {*} name
   * @param {*} race
   * @param {*} type
   * @param {*} level
   * @param {*} attribute
   * @param {*} id
   * @returns
   */
  fetchAndTransformCardData: async (data) => {
    try {
      console.log('SECTION 3.1: FETCH AND TRANSFORM CARD DATA', data.name);
      // Fetch user's collections and decks
      // const userCollections = await getUserCollections(userId);
      // const userDecks = await getUserDecks(userId);

      // console.log('SECTION 3.1: FETCH AND TRANSFORM CARD DATA', name);
      const response = await axiosInstance.get(
        `/cardinfo.php?${queryBuilder(data.name, data.race, data.type, data.level, data.attribute)}`,
      );
      const fetchedCards = response?.data?.data?.slice(0, 90); // Limiting to 30 cards
      // console.log('SECTION 3.1A: FETCH AND TRANSFORM CARD DATA', fetchedCards);

      const transformedCards = fetchedCards?.map((card) => {
        console.log('SECTION 3.1A: FETCH AND TRANSFORM CARD DATA', card.name);
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
            num: 0,
            timestamp: Date.now(),
          },
          latestPrice: {
            num: tcgplayerPrice,
            timestamp: Date.now(),
          },
          priceHistory: [],
          dailyPriceHistory: [],
          // priceHistory: [
          //   {
          //     num: tcgplayerPrice,
          //     timestamp: Date.now(),
          //   },
          // ],
          // dailyPriceHistory: [
          //   {
          //     num: tcgplayerPrice,
          //     timestamp: Date.now(),
          //   },
          // ],

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
      throw error; // Propagate the error
    }
  },
  // fetchAndTransformCardData: async (name, race, type, level, attribute, id) => {
  //   try {
  //     const query = queryBuilder(name, race, type, level, attribute, id);
  //     const response = await axiosInstance.get(`/cardinfo.php?${query}`);

  //     if (!response?.data?.data) {
  //       throw new Error('Failed to fetch card information');
  //     }

  //     const fetchedCards = response.data.data.slice(0, 90); // Limiting to 90 cards
  //     let cards = [];

  //     for (const card of fetchedCards) {
  //       const newCard = await createAndSaveCardInContext(
  //         card,
  //         null, // CollectionId may not be relevant for a search result context
  //         'CardInSearch',
  //         'SearchHistory',
  //       );
  //       cards.push(newCard);
  //     }

  //     return cards; // Return the array of CardInSearch instances
  //   } catch (error) {
  //     console.error('Error in fetchAndTransformCardData:', error);
  //     throw error;
  //   }
  // },
  getAllCards: async () => {
    let cards = await CardInSearch.find({}).limit(30);

    if (cards.length === 0) {
      await cardController.getCardsFromApi();
      cards = await CardInSearch.find({}).limit(30);
    }

    return cards;
  },
  getCardById: async (id) => {
    return await CardInSearch.findOne({ id: id });
  },
  getCardByType: async (type) => {
    return await CardInSearch.find({ type: type });
  },
  getCardByAttribute: async (attribute) => {
    return await CardInSearch.find({ attribute: attribute });
  },
  getCardByName: async (name) => {
    return await CardInSearch.findOne({ name: name });
  },
  // fetchCardImage: async (id, name) => {
  //   try {
  //     if (!id && !name) {
  //       throw new CustomError('Card ID or name is required', 400);
  //     }
  //     const response = await axiosInstance.get(`/cardinfo.php?name=${name}`);
  //     console.log('RESPONSE:', response);
  //     const fetchedCard = response?.data?.data?.[0];

  //     if (!fetchedCard) {
  //       throw new CustomError('Card not found', 404);
  //     }

  //     const bufferedImage = fetchedCard?.card_images?.[0]?.image_url;

  //     // if (!imageUrl) {
  //     //   throw new CustomError('Image not found', 404);
  //     // }

  //     return bufferedImage;

  //     // const imageResponse = await axios.get(imageUrl, {
  //     //   responseType: 'arraybuffer',
  //     // });

  //     // const buffer = Buffer.from(imageResponse.data, 'binary');
  //     // return buffer;
  //   } catch (error) {
  //     console.error('Error fetching card image:', error);
  //     throw error; // Propagate the error
  //   }
  // },
  updateExistingCardInUserCollection: async (userId, collectionId, cardUpdates) => {
    try {
      if (!Array.isArray(cardUpdates)) {
        throw new Error('Card updates should be an array');
      }

      const user = await User.findById(userId).populate({
        path: 'allCollections',
        populate: { path: 'cards', model: 'CardInCollection' },
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
        populate: {
          path: 'cards',
          model: 'CardInCollection',
        },
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
        populate: { path: 'cards', model: 'CardInDeck' },
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
        populate: { path: 'cards', model: 'CardInDeck' },
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
        populate: { path: 'cards', model: 'CardInDeck' },
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
        populate: { path: 'cards', model: 'CardInDeck' },
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
        populate: { path: 'cards', model: 'CardInDeck' },
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

module.exports = {
  cardController,
};
// ! MOST LIKELY TO REUSE
// const searchTerms = { name, race, type, level, attribute, id };
// // TODO: modify this to return all searchHistory entries
// let allSearchHistoryEntries = await SearchHistory.find({});
// let searchResultsFromHistory = await SearchHistory.findOne({
//   // searchTerms: searchTerms,
//   searchTermsAndResults: [
//     {
//       $elemMatch: {
//         searchTerms: searchTerms,
//       },
//     },
//   ],
// });

// let newSearchResultEntry = {
//   searchTerms,
//   cards: [],
// };
// let existingCardsInSearchHistory =
//   searchResultsFromHistory?.searchTermsAndResults?.cards || [];
// // let allSearchHistoryEntries = searchResultsFromHistory?.searchTermsAndResults || [];
// let specificSearchHistoryEntry = searchResultsFromHistory?.searchTermsAndResults || {};

// let entryName = specificSearchHistoryEntry?.name || '';
// let entrySearchTerms = specificSearchHistoryEntry?.searchTerms || {};
// let entryCards = specificSearchHistoryEntry?.cards || [];
// let updatedEntryCards = [];
// let fetchedUpdatedSearchPrices = [];
// let transformedCards = [];
// let updatedSearchResultsHistory = [
//   ...searchResultsFromHistory,
//   {
//     name: entryName,
//     searchTerms: entrySearchTerms,

//     cards: searchResultsFromHistory?.searchTermsAndResults?.cards
//       ? searchResultsFromHistory?.searchTermsAndResults?.cards
//       : [],
//   },
// ];

// if (existingCardsInSearchHistory.length > 0) {
//   console.log('UPDATING EXISTING CARDS IN CONTEXT:', existingCardsInSearchHistory);

//   let namesOfExistingCards = existingCardsInSearchHistory.map((card) => card.name);
//   fetchedUpdatedSearchPrices = await fetchCardPrices(namesOfExistingCards);

//   for (let card of existingCardsInSearchHistory) {
//     const updatedCardsInContexts = await processContextualData(
//       ['SearchHistory', 'Collection', 'Deck', 'Cart'],
//       id,
//       fetchedUpdatedSearchPrices[card?.name],
//     );
//     const cards = updatedCardsInContexts?.existingCardsInContext;

//     // Update the card's price and quantity
//     updatedEntryCards = cards.map((card) => {
//       card.price = fetchedUpdatedSearchPrices[card?.name]?.tcgplayer_price;
//       card.totalPrice = card.price * card.quantity;
//       return card;
//     });

//     transformedCards.push(createCardData(cards));
//   }
//   // if the cards have been updated and the updatedSearchResultsHistory has been updated, then update the corresponding entry in the search history
//   if (
//     updatedEntryCards.length > 0 &&
//     updatedSearchResultsHistory.length > 0 &&
//     updatedSearchResultsHistory[0].cards.length > 0 &&

//   ) {
//     await SearchHistory.create(newSearchResultEntry);
//   }
// } else {
//   const response = await axiosInstance.get(
//     `/cardinfo.php?${queryBuilder(name, race, type, level, attribute, id)}`,
//   );
//   const fetchedCards = response?.data?.data?.slice(0, 90); // Limiting to 90 cards

//   for (const card of fetchedCards) {
//     const tcgplayerPrice = card?.card_prices[0]?.tcgplayer_price || 0;
//     // let card_set = card?.card_sets?.length > 0 ? card.card_sets[0] : null;

//     // const rarity = card_set?.set_rarity || '';
//     // const downloadedImagePath = await downloadCard(card);
//     const data = createCardData(card, tcgplayerPrice);
//     console.log('CREATING NEW CARD FOR SEARCH HISTORY:', data);

//     // if (existingCardsInSearchHistory) {
//     const newCard = new CardInSearch(data);
//     await newCard.save();

//     // add new card to new search entry
//     newSearchResultEntry.cards.push(newCard);
//   }
//   if (newSearchResultEntry.cards.length > 0) {
//     await SearchHistory.create(newSearchResultEntry);
//   }
// }
// return transformedCards; // Return the array of transformed card data

// ! MOST LIKELY TO REUSE

// ! --------- querybuilder ---------
// function queryBuilder(name, race, type, level, attribute, id) {
//   const params = [
//     // GENERAL SEARCH PARAMS

//     name: name,
//     race: race,
//     type: type,
//     level: level,
//     attribute: attribute,
//     id: id,
//   ]

//     // CARD SET PARAMS
//     // set: params.set,
//     // set_type: params.set_type,
//     // set_rarity: params.set_rarity,
//     // set_price: params.set_price,
//     // CARD IMAGE PARAMS
//     // image: params.image,
//     // image_url: params.image_url,
//     // image_url_small: params.image_url_small,
//     // image_url_cropped: params.image_url_cropped,
//     // CARD PRICE PARAMS
//     // cardmarket_price: params.cardmarket_price,
//     // tcgplayer_price: params.tcgplayer_price,
//     // ebay_price: params.ebay_price,
//     // amazon_price: params.amazon_price,
//     // coolstuffinc_price: params.coolstuffinc_price,

//   console.log('SECTION 3.1A: QUERY BUILDER PARAMS');
//   return Object.keys()
//     .filter((key) => params[key] !== undefined && params[key] !== null)
//     .map((key) => `${key}=${encodeURIComponent(params[key])}`)
//     .join('&');
// }
// ! --------- querybuilder ---------
// Process contextual data for each card
// async function processContextualData(contexts, cardId, prices) {
//   // Refactor the existing logic for contextual data processing...
//   let existingCardsInContext = [];
//   // Iterate over each context to update prices and quantities
//   for (const context of contexts) {
//     // Check if the card exists in the context
//     // let updatedCard = await eval(`CardIn${context}`).findOne({ id: cardId });
//     let existingCardInContext = await eval(`CardIn${context}`).findOne({ id: cardId });
//     let contextualQuantities = {};

//     if (existingCardInContext) {
//       existingCardInContext.latestPrice = prices.tcgplayer_price;
//       existingCardInContext.price = prices.tcgplayer_price;
//       contextualQuantities[context] = getContextualQuantities(existingCardInContext, context);
//       await existingCardInContext.save();

//       // push the card into the existingCardsInContext array
//       existingCardsInContext.push(existingCardInContext);
//     }
//   }

//   // return updated card with contextual data
//   return {
//     existingCardsInContext,
//   };
// }

// function queryBuilder(name, race, type, level, attribute, id) {
//   const queryParts = [
//     name && `fname=${encodeURIComponent(name)}`,
//     race && `race=${encodeURIComponent(race)}`,
//     type && `type=${encodeURIComponent(type)}`,
//     level && `level=${encodeURIComponent(level)}`,
//     attribute && `attribute=${encodeURIComponent(attribute)}`,
//     id && `id=${encodeURIComponent(id)}`,
//   ].filter(Boolean);
//   // GENERAL SEARCH PARAMS
//   // if (name) queryParts.push(`fname=${encodeURIComponent(name)}`);
//   // if (race) queryParts.push(`race=${encodeURIComponent(race)}`);
//   // if (type) queryParts.push(`type=${encodeURIComponent(type)}`);
//   // if (level) queryParts.push(`level=${encodeURIComponent(level)}`);
//   // if (attribute) queryParts.push(`attribute=${encodeURIComponent(attribute)}`);
//   // if (id) queryParts.push(`id=${encodeURIComponent(id)}`);

//   // CARD SET PARAMS
//   // if (params.set) queryParts.push(`set=${encodeURIComponent(params.set)}`);
//   // if (params.set_type) queryParts.push(`set_type=${encodeURIComponent(params.set_type)}`);
//   // if (params.set_rarity)
//   //   queryParts.push(`set_rarity=${encodeURIComponent(params.set_rarity)}`);
//   // if (params.set_price) queryParts.push(`set_price=${encodeURIComponent(params.set_price)}`);

//   // CARD IMAGE PARAMS
//   // if (params.image) queryParts.push(`image=${encodeURIComponent(params.image)}`);
//   // if (params.image_url)
//   //   queryParts.push(`image_url=${encodeURIComponent(params.image_url)}`);
//   // if (params.image_url_small)
//   //   queryParts.push(`image_url_small=${encodeURIComponent(params.image_url_small)}`);
//   // if (params.image_url_cropped)
//   //   queryParts.push(`image_url_cropped=${encodeURIComponent(params.image_url_cropped)}`);

//   // CARD PRICE PARAMS
//   // if (params.cardmarket_price)
//   //   queryParts.push(`cardmarket_price=${encodeURIComponent(params.cardmarket_price)}`);
//   // if (params.tcgplayer_price)
//   //   queryParts.push(`tcgplayer_price=${encodeURIComponent(params.tcgplayer_price)}`);
//   // if (params.ebay_price) queryParts.push(`ebay_price=${encodeURIComponent(params.ebay_price)}`);
//   // if (params.amazon_price)
//   //   queryParts.push(`amazon_price=${encodeURIComponent(params.amazon_price)}`);
//   // if (params.coolstuffinc_price)
//   //   queryParts.push(`coolstuffinc_price=${encodeURIComponent(params.coolstuffinc_price)}`);

//   return queryParts.join('&');
// }
// getCardsFromApi: async () => {
//   try {
//     const response = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php');
//     const fetchedCards = response.data.data.slice(0, 30); // Limiting to 30 cards

//     // Get IDs of fetched cards
//     const fetchedCardIds = fetchedCards.map((card) => card.id);

//     // Find which of these cards already exist in the database
//     const existingCards = await CardInContext.find({ id: { $in: fetchedCardIds } });
//     const existingCardIds = new Set(existingCards.map((card) => card.id));

//     // Filter out cards that already exist
//     const newCards = fetchedCards.filter((card) => !existingCardIds.has(card.id));

//     // Create new card documents
//     const newCardDocuments = newCards.map(
//       (card) =>
//         new CardInSearch({
//           id: card.id,
//           name: card.name,
//           type: card.type,
//           frameType: card.frameType,
//           desc: card.desc,
//           atk: card.atk,
//           def: card.def,
//           level: card.level,
//           race: card.race,
//           attribute: card.attribute,
//           card_images: card.card_images,
//           image: card.card_images[0].image_url,
//           card_prices: card.card_prices,
//         }),
//     );

//     // Insert all new cards in a single operation
//     await CardInContext.insertMany(newCardDocuments);
//   } catch (error) {
//     console.error('Error fetching data from the API: ', error);
//   }
// },
// fetchAndTransformCardData: async (name, race, type, level, attribute) => {
//   try {
//     // Ensure the query is built with an object containing the parameters
//     // const queryString = queryBuilder(params);
//     const response = await axiosInstance.get(
//       `/cardinfo.php?${queryBuilder(name, race, type, level, attribute)}`,
//     );
//     const fetchedCards = response?.data?.data?.slice(0, 90); // Limiting to 30 cards

//     logData(fetchedCards[0]);
//     const transformedCards = await Promise.all(
//       fetchedCards?.map(async (card) => {
//         const tcgplayerPrice = card?.card_prices[0]?.tcgplayer_price || 0;
//         let card_set = null;
//         if (card?.card_sets && card?.card_sets?.length > 0) {
//           card_set = card?.card_sets[0];
//         }
//         const rarity = card_set?.set_rarity || '';
//         const downloadedImagePath = await downloadCard(card);
//         // if (loadVariant && card.card_sets) {
//         //   variants = card.card_sets.map((set) => ({
//         //     set_name: set.set_name,
//         //     set_code: set.set_code,
//         //     set_rarity: set.set_rarity,
//         //     set_price: set.set_price,
//         //     // other variant specific fields
//         //   }));
//         // }
//         return {
//           // custom data
//           image: card?.card_images.length > 0 ? card.card_images[0].image_url : '',
//           downloadedImage: downloadedImagePath,
//           quantity: 0,
//           price: tcgplayerPrice,
//           totalPrice: 0,
//           // tag: '',
//           // collectionId: '',
//           watchList: false,
//           rarity: rarity,
//           card_set: card_set ? card_set : {},
//           chart_datasets: [
//             {
//               x: Date.now(),
//               y: tcgplayerPrice,
//             },
//           ],
//           lastSavedPrice: {
//             num: tcgplayerPrice,
//             timestamp: Date.now(),
//           },
//           latestPrice: {
//             num: tcgplayerPrice,
//             timestamp: Date.now(),
//           },
//           dataOfLastPriceUpdate: Date.now(),
//           priceHistory: [
//             {
//               num: tcgplayerPrice,
//               timestamp: Date.now(),
//             },
//           ],
//           dailyPriceHistory: [
//             {
//               num: tcgplayerPrice,
//               timestamp: Date.now(),
//             },
//           ],
//           _id: new mongoose.Types.ObjectId(), // Generate a unique identifier for each card

//           // preset data
//           // id: card.id.toString(),
//           name: card.name,
//           type: card.type,
//           frameType: card.frameType,
//           desc: card.desc,
//           atk: card.atk,
//           def: card.def,
//           level: card.level,
//           race: card.race,
//           attribute: card.attribute,
//           archetype: [], // Assuming logic to determine this
//           card_sets: card.card_sets,
//           card_images: card.card_images,
//           card_prices: card.card_prices,
//         };
//       }),
//     );

//     return transformedCards;
//   } catch (error) {
//     console.error('Error fetching card information:', error);
//     logError(
//       'Error fetching card information:',
//       error?.response?.statusText,
//       error?.response?.data,
//       {
//         source: 'cardController.fetchAndTransformCardData',
//       },
//     );
//     throw error; // Propagate the error
//   }
// },

// fetchAndTransformCardData: async (name, race, type, level, attribute, id) => {
//   try {
//     let transformedCards = [];
//     // create searchHistory array which contains previous search terms and results
//     // Check if the search terms already exist in the search history, and then return an array of cards in which the search terms match
//     let existingCardsInSearchHistory = [];
//     let existingCardsInContext = [];
//     let namesOfExistingCards = [];
//     let fetchedUpdatedSearchPrices = [];
//     let searchHistoryWithUpdatedValues = [];
//     let searchTerms = {
//       name: name,
//       race: race,
//       type: type,
//       level: level,
//       attribute: attribute,
//       id: id,
//     };
//     let searchResultsFromHistory = await SearchHistory.find({
//       searchTerms: searchTerms,
//     });
//     if (searchResultsFromHistory) {
//       // return cards from search history
//       existingCardsInSearchHistory = searchResultsFromHistory.cards;
//       namesOfExistingCards = existingCardsInSearchHistory?.map((card) => card.name);
//     }
//     if (namesOfExistingCards?.length > 0) {
//       // if the card is from search history, then fetch the card from searchHistory and do a specific price update search
//       fetchedUpdatedSearchPrices = await fetchCardPrices(namesOfExistingCards);
//     }

//     const createAndUpdateCardsDataForSearchHistory = (data, prices) => {
//       // Check if card is defined
//       if (!data) {
//         throw new Error('Card data is required');
//       }
//       console.log('EXISTING CARD IN SEARCH HISTORY:', data);
//       let card = null;
//       // return card data
//       return createCardData(card, data, prices);
//     };

//     for (let i = 0; i < existingCardsInSearchHistory.length; i++) {
//       searchHistoryWithUpdatedValues.push(
//         createAndUpdateCardsDataForSearchHistory(
//           existingCardsInSearchHistory[i],
//           fetchedUpdatedSearchPrices[i],
//         ),
//       );
//     }
//     // if the card is also in a collection, then fetch the card from that collection and return specific values for that card related to that collection
//     const contexts = ['SearchHistory', 'Collection', 'Deck', 'Cart'];
//     let contextualQuantities = {
//       SearchHistory: 0,
//       Collection: 0,
//       Deck: 0,
//       Cart: 0,
//     };

//     // Iterate over each context to update prices and quantities
//     for (const context of contexts) {
//       // Check if the card exists in the context
//       let existingCardInContext = await eval(`CardIn${context}`).findOne({ id: id });
//       if (existingCardInContext) {
//         existingCardInContext.latestPrice = fetchedUpdatedSearchPrices.tcgplayer_price;
//         existingCardInContext.price = fetchedUpdatedSearchPrices.tcgplayer_price;
//         contextualQuantities[context] = existingCardInContext.quantity;
//         await existingCardInContext.save();

//         // push the card into the existingCardsInContext array
//         existingCardsInContext.push(existingCardInContext);
//       }
//     }
