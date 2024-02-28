// fetchAndTransformCardData: async (userId, label, name, race, type, level, attribute, id) => {
//   try {
//     const searchTerms = { name, race, type, level, attribute, id };
//     // Check if a search session with these terms already exists for the user
//     // Check if a search session with these terms already exists for the user
//     const existingSession = await SearchSession.findOne({
//       userId,
//       'searchTerms.name': name,
//     }).populate('results.cardId');

//     let cards = [];

//     if (existingSession) {
//       console.log('[SESSION EXISTS]', existingSession.label);
//       // Update card details and return them
//       cards = await Promise.all(
//         existingSession.results.map(async (result) => {
//           const updatedCard = await updateCardWithLatestPrices(result.cardId);
//           return updatedCard;
//         }),
//       );
//     } else {
//       console.log('[SESSION DOES NOT EXIST]', searchTerms.name);
//       const query = queryBuilder(name, race, type, level, attribute, id);
//       console.log('[FETCHING DATA]', query);
//       const response = await axiosInstance.get(`/cardinfo.php?${query}`);

//       if (!response?.data?.data) {
//         throw new Error('Failed to fetch card information');
//       }

//       console.log('[FETCHED DATA][0]', response.data.data[0].name);
//       const fetchedCards = response.data.data.slice(0, 90); // Limiting to 90 cards

//       let searchResults = [];

//       for (const card of fetchedCards) {
//         // Directly using the card data from fetched data
//         const newCard = await createAndSaveCardInContext(
//           card, // Directly passing fetched card data
//           null, // CollectionId may not be relevant for a search result context
//           'CardInSearch', // CardModel
//           'SearchHistory', // CollectionModel
//         );
//         cards.push(newCard);

//         const searchResult = new SearchResult({ cardId: newCard._id });
//         searchResults.push(searchResult);
//       }

//       // Save the new search session
//       const newSession = new SearchSession({
//         label,
//         searchTerms: [searchTerms],
//         results: searchResults, // Use the newly created search results
//       });

//       await newSession.save();

//       // Add this search session to the user's search history
//       await SearchHistory.findOneAndUpdate(
//         { userId },
//         { $push: { sessions: newSession._id } },
//         { new: true, upsert: true },
//       );
//     }

//     return cards; // Return the array of CardInSearch instances
//   } catch (error) {
//     console.error('Error in fetchAndTransformCardData:', error);
//     throw error;
//   }
// },
// fetchAndTransformCardData = async (userId, label, name, race, type, level, attribute, id) => {
//   try {
//     const searchTerms = { name, race, type, level, attribute, id };

//     // Create a new search session for these search terms
//     const searchSession = await new SearchSession({
//       label,
//       searchTerms: [searchTerms],
//       results: []
//     }).save();

//     // Add this search session to the user's search history
//     const userSearchHistory = await SearchHistory.findOneAndUpdate(
//       { userId },
//       { $push: { sessions: searchSession._id } },
//       { new: true, upsert: true }
//     );

//     // Fetch card data based on the search terms
//     const query = queryBuilder(name, race, type, level, attribute, id);
//     const response = await axios.get(`https://api.example.com/cardinfo.php?${query}`);

//     if (!response?.data?.data) {
//       throw new Error('Failed to fetch card information');
//     }

//     const fetchedCards = response.data.data.slice(0, 90); // Limiting to 90 cards

//     // Transform fetched cards into CardInSearch instances and add them to the search results
//     for (const card of fetchedCards) {
//       const cardData = createCardData(card, card.card_prices[0]?.tcgplayer_price || 0, '');
//       const newCard = await new CardInSearch(cardData).save();

//       // Create a search result for each card
//       const searchResult = new SearchResult({ cardId: newCard._id });
//       searchSession.results.push(searchResult);
//     }

//     // Save the updated search session
//     await searchSession.save();

//     return searchSession; // Return the populated search session
//   } catch (error) {
//     console.error('Error in fetchAndTransformCardData:', error);
//     throw error;
//   }
// fetchAndTransformCardData: async (name, race, type, level, attribute, id) => {
//   try {
//     const searchTerms = { name, race, type, level, attribute, id };
//     let searchHistoryEntry = await SearchHistory.findOne({
//       'searchTermsAndResults.searchTerms': searchTerms,
//     });

//     if (searchHistoryEntry) {
//       let existingCards = searchHistoryEntry.searchTermsAndResults.cards;
//       let updatedCards = await Promise.all(existingCards.map(updateCardWithLatestPrices));
//       let isUpdated = JSON.stringify(existingCards) !== JSON.stringify(updatedCards);

//       if (isUpdated) {
//         searchHistoryEntry.searchTermsAndResults.cards = updatedCards;
//         await searchHistoryEntry.save();
//       }

//       return updatedCards;
//     } else {
//       const query = queryBuilder(name, race, type, level, attribute, id);
//       const response = await axiosInstance.get(`/cardinfo.php?${query}`);

//       if (!response?.data?.data) {
//         throw new Error('Failed to fetch card information');
//       }

//       const fetchedCards = response.data.data.slice(0, 90);

//       const newCards = fetchedCards.map(
//         (card) =>
//           new CardInSearch(createCardData(card, card.card_prices[0]?.tcgplayer_price || 0, '')),
//       );
//       await SearchHistory.create({ searchTerms, cards: newCards });
//       return newCards;
//     }
//   } catch (error) {
//     console.error('Error in fetchAndTransformCardData:', error);
//     throw error;
//   }
// },
// fetchAndTransformCardData: async (name, race, type, level, attribute, id) => {
//   try {
//     const searchTerms = { name, race, type, level, attribute, id };
//     console.log('SECTION 3.1 COMPLETE: TERMS', searchTerms.name);
//     let newSearchResultEntry = {
//       searchTerms,
//       cards: [],
//     };
//     // Find the existing search history entry for the given search terms
//     let existingSearchHistoryEntry = await SearchHistory.findOne({
//       'searchTermsAndResults.searchTerms': searchTerms,
//     });

//     if (existingSearchHistoryEntry) {
//       // Extract cards from the existing search history
//       let existingCardsInSearchHistory = existingSearchHistoryEntry.searchTermsAndResults.cards;
//       console.log('SECTION 3.2 COMPLETE: EXISTING HISTORY', existingCardsInSearchHistory);
//       // Fetch updated prices for the existing cards
//       let namesOfExistingCards = existingCardsInSearchHistory.map((card) => card.name);
//       let fetchedUpdatedSearchPrices = await fetchCardPrices(namesOfExistingCards);
//       console.log('SECTION 3.3 COMPLETE: FETCHED PRICES', fetchedUpdatedSearchPrices);
//       // Update existing cards with new prices and any other necessary data
//       let updatedCards = existingCardsInSearchHistory.map((card) => {
//         let updatedPrice = fetchedUpdatedSearchPrices[card.name]?.tcgplayer_price || card.price;
//         const contexts = ['SearchHistory', 'Collection', 'Deck', 'Cart'];

//         for (const context of contexts) {
//           let firstThreeInput = {
//             card,
//             contexts,
//             context,
//           };
//           card.latestPrice = {
//             num: updatedPrice,
//             timestamp: Date.now(),
//           };
//           card.price = updatedPrice;
//           card.totalPrice = card.price * card.quantity;
//           card.contextualQuantities[`${context}`] = getContextualValue(
//             firstThreeInput,
//             'quantity',
//           );
//           card.contextualTotalPrice[`${context}`] = getContextualValue(
//             firstThreeInput,
//             'totalPrice',
//           );
//           card.dataOfLastPriceUpdate = Date.now();
//         }
//         return card;
//       });
//       console.log('SECTION 3.4 COMPLETE: UPDATED CARDS', updatedCards[0]);

//       // Check if there is any difference between existing cards and updated cards
//       let isUpdated =
//         JSON.stringify(existingCardsInSearchHistory) !== JSON.stringify(updatedCards);

//       if (isUpdated) {
//         // Update the search history entry with the updated cards
//         existingSearchHistoryEntry.searchTermsAndResults.cards = updatedCards;
//         await existingSearchHistoryEntry.save();
//         console.log('SECTION 3.5 COMPLETE: UPDATED HISTORY', existingSearchHistoryEntry);
//       } else {
//         console.log('SECTION 3.5 COMPLETE: NO UPDATES');
//       }

//       return updatedCards;
//     } else {
//       // If no existing entry, fetch new cards and create a new search history entry
//       const response = await axiosInstance.get(
//         `/cardinfo.php?${queryBuilder(name, race, type, level, attribute, id)}`,
//       );
//       if (!response?.data?.data) {
//         const messagePrefix = 'Failed at Section 3.1B: Card not found';
//         console.error(
//           'Error fetching card information:',
//           messagePrefix + response?.statusText,
//           response?.data,
//           {
//             source: 'cardController.fetchAndTransformCardData',
//           },
//         );
//         return response.status(400).json({
//           status: 'ERROR',
//           message: messagePrefix,
//           data: response,
//         });
//       }
//       console.log('SECTION 3.1B COMPLETE: RESPONSE');
//       const fetchedCards = response?.data?.data?.slice(0, 90); // Limiting to 90 cards
//       console.log('SECTION 3.1C COMPLETE: FETCHED CARDS', fetchedCards[0].name);

//       for (const card of fetchedCards) {
//         const tcgplayerPrice = card?.card_prices[0]?.tcgplayer_price || 0;
//         const cardData = createCardData(card, tcgplayerPrice);
//         console.log('SECTION 3.2 COMPLETE: CREATED CARD DATA', cardData.name);
//         // function to set the searchTerms of the new search history entry
//         newSearchResultEntry.searchTerms = searchTerms;
//         // function to create new card in search history
//         newSearchResultEntry.cards.push(
//           new CardInSearch({
//             ...cardData,
//           }),
//         );
//       }

//       if (newSearchResultEntry.cards.length > 0) {
//         await SearchHistory.create(newSearchResultEntry);
//         console.log(
//           'SECTION 3.3 COMPLETE: CREATED NEW SEARCH HISTORY ENTRY',
//           newSearchResultEntry.cards[0].name,
//         );
//       }

//       return newSearchResultEntry.cards;
//     }
//   } catch (error) {
//     console.error('Error fetching card information:', error);
//     throw error;
//   }
// },
