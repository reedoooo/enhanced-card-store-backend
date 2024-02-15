// !--------------------------! COLLECTIONS !--------------------------!
const moment = require('moment'); // Assuming moment.js is used for date formatting
const { CardInCollection } = require('../../../models/Card');
const { Collection } = require('../../../models/Collection');
const { cardController } = require('../../Cards/CardController');
const { fetchCardPrices } = require('../../Cards/helpers');
const { populateUserDataByContext, deepPopulateCardFields } = require('../dataUtils');
const {
  setupDefaultCollectionsAndCards,
  reFetchForSave,
  fetchUserIdsFromUserSecurityData,
} = require('../helpers');

// COLLECTION ROUTES (GET, CREATE, UPDATE, DELETE)
/**
 * Gets all collections for a user.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 */
exports.getAllCollectionsForUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const populatedUser = await populateUserDataByContext(userId, ['collections']);
    if (!populatedUser) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({
      message: `Fetched collections for user ${userId}`,
      data: populatedUser.allCollections,
    });
  } catch (error) {
    console.error('Error fetching collections', { error });
    next(error);
  }
};
/**
 * Creates a new collection for a user.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 */
exports.createNewCollection = async (req, res, next) => {
  const { userId } = req.params;
  const { collectionData } = req.body; // Assume the body contains new collection details
  const collectionModel = 'Collection'; // Adjust according to your schema
  try {
    console.log('Creating new collection for user:', userId, collectionData);
    const populatedUser = await populateUserDataByContext(userId, ['collections']);
    if (!populatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Create the new collection
    const newCollection = await setupDefaultCollectionsAndCards(
      populatedUser,
      collectionModel,
      collectionData,
    );
    // Push the new collection ID to user's collections
    populatedUser.allCollections.push(newCollection._id);
    await populatedUser.save();

    // Populate cards field in the new collection if needed
    const populatedCollection = await Collection.findById(newCollection._id).populate('cards');

    res.status(201).json({
      message: 'New collection created successfully',
      data: populatedCollection,
    });
  } catch (error) {
    console.error('Error in createNewCollection', error);
    next(error);
  }
};
/**
 * Updates a collection for a user and syncs the collection's cards with the database.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 * @todo Update this to use the new CardInCollection schema
 */
exports.updateAndSyncCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const updatedCollectionData = req.body; // Assume this contains the updated details for the collection and cards

  try {
    const populatedUser = await populateUserDataByContext(userId, ['collections']);

    const collection = populatedUser.allCollections.find(
      (coll) => coll._id.toString() === collectionId,
    );

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Update collection details
    Object.assign(collection, updatedCollectionData);
    collection.totalQuantity = 0;
    collection.totalPrice = 0;

    for (const cardData of collection.cards) {
      const card = await CardInCollection.findById(cardData?._id).populate([
        deepPopulateCardFields(),
      ]);
      if (card) {
        // Update cardVariant fields as necessary based on cardData
        await card.save();

        collection.totalQuantity += card.quantity; // Update this based on your schema
        collection.totalPrice += card.price; // Update this based on your schema
      }
    }

    await collection.save();

    res.status(200).json({
      message: 'Collection updated successfully',
      data: collection, // This now includes updated cards
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    next(error);
  }
};
/**
 * Deletes a collection for a user and removes the collection from the user's collections.
 * Optionally, you might want to delete the collection from the Collection model as well.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 * @todo Update this to use the new CardInCollection schema
 * @todo Optionally, you might want to delete the collection from the Collection model as well.
 * @todo Update this to use the new CardInCollection schema
 */
exports.deleteCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;

  try {
    const populatedUser = await populateUserDataByContext(userId, ['collections']);

    if (!populatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove the collection from the user's collections
    populatedUser.allCollections = populatedUser.allCollections.filter(
      (c) => c._id.toString() !== collectionId,
    );
    await populatedUser.save();

    // Optionally, you might want to delete the collection from the Collection model as well
    await Collection.findByIdAndDelete(collectionId);

    res.status(200).json({ message: 'Collection deleted successfully', data: collectionId });
  } catch (error) {
    console.error('Error deleting collection:', error);
    next(error);
  }
};
// COLLECTION ROUTES: CHARTS-IN-COLLECTION ROUTES (UPDATE)
/**
 * Updates the chart data for a collection and returns the updated chart data.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 */
exports.updateChartDataInCollection = async (req, res, next) => {
  const { collectionId, userId } = req.params;
  const { cards } = req.body;

  try {
    const populatedUser = await populateUserDataByContext(userId, ['collections']);
    if (!populatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const collection = populatedUser.allCollections.find(
      (coll) => coll._id.toString() === collectionId,
    );

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const currentDateLabel = moment().format('DD/MM/YYYY - 23:59');
    let cumulativeCollectionPrice = 0;

    for (const updatedCardData of cards) {
      const card = await CardInCollection.findById(updatedCardData._id);

      if (card) {
        for (let i = 0; i < card.quantity; i++) {
          const cardValue = card.price; // Assuming price per single card
          cumulativeCollectionPrice += cardValue;

          const cardEntry = {
            label: `${card.name}[${currentDateLabel}]`,
            x: new Date(),
            y: cardValue, // Value of a single card
          };
          card.chart_datasets.push(cardEntry);
        }
        await card.save();
      } else {
        console.error(`Card not found: ${updatedCardData._id}`);
      }
    }

    // Update the collection's cumulative chart data
    const collectionUpdateEntry = {
      label: `Collection Update[${currentDateLabel}]`,
      x: new Date(),
      y: cumulativeCollectionPrice, // Total value of all cards
    };
    collection.chartData.allXYValues.push(collectionUpdateEntry);

    await collection.save();

    // Repopulate the collection
    await collection.populate({
      path: 'cards',
      model: 'CardInCollection',
      populate: deepPopulateCardFields(),
    });

    res.status(200).json({
      message: 'Chart data updated successfully',
      data: { allXYValues: collection.chartData.allXYValues, updatedCards: collection.cards },
    });
  } catch (error) {
    console.error('Error updating chart data in collection:', error);
    next(error);
  }
};
// COLLECTION ROUTES: CARDS-IN-COLLECTION Routes (GET, CREATE, UPDATE, DELETE)
/**
 * STATUS:
 * [O] OPERATIONAL
 * Adds a new card to a collection or updates the data of an existing card and returns the updated data
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @todo Update this to use the new CardInCollection schema
 */
exports.addCardsToCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards } = req.body;
  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array.' });
  }
  try {
    const populatedUser = await populateUserDataByContext(userId, ['collections']);

    const collection = populatedUser.allCollections.find(
      (coll) => coll._id.toString() === collectionId,
    );
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found.' });
    }
    const processedCardIds = new Set(); // Set to track processed card IDs

    for (const cardData of cards) {
      if (processedCardIds.has(cardData.id)) {
        console.log('Skipping duplicate card:', cardData.id);
        continue; // Skip duplicate card IDs
      }
      console.log('Processing card:'.red, cardData.id);
      console.log(
        'IDS OF ALL CARDS IN COLLECTION:'.red,
        collection.cards.map((c) => c.id),
      );
      let cardInCollection = collection?.cards?.find((c) => c.id.toString() === cardData.id);
      console.log('Card in collection: '.red, cardInCollection);
      if (cardInCollection) {
        console.log('Updating existing card:', cardInCollection.name.blue);
        cardInCollection.quantity += cardData.quantity;
        await cardInCollection.save(); // pre-save will handle totalPrice and other calculations

        // Update collection's total quantity and price
        collection.totalQuantity += cardData.quantity;
        collection.totalPrice += cardData.quantity * cardInCollection.price;
      } else {
        const reSavedCard = await reFetchForSave(
          cardData,
          collectionId,
          'Collection',
          'CardInCollection',
        );
        // console.log('Re-saved card:', reSavedCard.name);
        // const newCard = new CardInCollection(newCardData);
        // await newCard.save();
        collection.cards.push(reSavedCard?._id);
      }
      processedCardIds.add(cardData.id); // Add card ID to the Set
    }

    await collection.save();

    await populatedUser.save();

    // Repopulate the collection
    await collection.populate({
      path: 'cards',
      model: 'CardInCollection',
    });
    res.status(200).json({ message: 'Cards added to collection successfully.', data: collection });
  } catch (error) {
    console.error('Error adding cards to collection:', error);
    next(error);
  }
};
/**
 * STATUS:
 *![X] NOT OPERATIONAL
 * Removes cards from a collection and returns the updated collection data.
 * @param {Request} req - The request object
 * req.body = {
 * @param {Array} cardIds - The IDs of the cards to remove
 * }
 * @param {Response} res - The response object
 */
exports.removeCardsFromCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards } = req.body;

  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array.' });
  }

  try {
    let populatedUser = await populateUserDataByContext(userId, ['collections']);

    const collection = populatedUser.allCollections.find(
      (coll) => coll._id.toString() === collectionId,
    );

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found.' });
    }

    // Remove specified cards
    const cardIdsToRemove = cards.map((c) => c._id);
    collection.cards = collection.cards.filter((card) => !cardIdsToRemove.includes(card.id));

    // Now, you'll have to remove these cards from the CardInCollection model as well
    await CardInCollection.deleteOne({ _id: { $in: cardIdsToRemove }, collectionId });

    await collection.save();

    await populatedUser.save();

    populatedUser = await populateUserDataByContext(userId, ['collections']);

    // return the updated collection from the populated user
    const updatedCollection = populatedUser.allCollections.find(
      (coll) => coll._id.toString() === collectionId,
    );

    res
      .status(200)
      .json({ message: 'Cards updated in collection successfully.', data: updatedCollection });
  } catch (error) {
    console.error('Error updating collection:', error);
    next(error);
  }
};
/**
 * Updates the cards in a collection and returns the updated collection data.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
exports.updateCardsInCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards, type } = req.body;

  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array.' });
  }

  try {
    const populatedUser = await populateUserDataByContext(userId, ['collections']);
    const collection = populatedUser?.allCollections.find(
      (coll) => coll._id.toString() === collectionId,
    );

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found.' });
    }

    for (const cardData of cards) {
      const cardInCollection = await CardInCollection.findById(cardData?._id);

      if (cardInCollection) {
        console.log('Updating existing card:', cardInCollection.name.blue);
        // set the card's quantity to the updated quantity
        if (cardInCollection.quantity !== cardData.quantity) {
          console.log('Updating card quantity');
          cardInCollection.quantity = cardData.quantity;
        }
        if (cardInCollection.quantity === cardData.quantity && type === 'increment') {
          console.log('Incrementing card quantity');
          cardInCollection.quantity += 1;
        }
        if (cardInCollection.quantity === cardData.quantity && type === 'decrement') {
          console.log('Decrementing card quantity');
          cardInCollection.quantity -= 1;
        }
        console.log('Card quantity:', cardInCollection.quantity);

        // Save the card with pre-save hooks
        await cardInCollection.save();

        // Update collection's total quantity and price
        collection.totalQuantity += cardInCollection.quantity;
        collection.totalPrice += cardInCollection.quantity * cardInCollection.price;

        // Update the card's contextual quantities and prices
      } else {
        console.log(`Card not found in collection: ${cardData._id}`);
      }
    }

    await collection.save();

    await populatedUser.save();

    // Repopulate the collection
    await collection.populate({
      path: 'cards',
      model: 'CardInCollection',
      populate: deepPopulateCardFields(),
    });

    // // Filter out duplicate card objects
    // const uniqueCardsMap = new Map();
    // collection.cards.forEach((card) => uniqueCardsMap.set(card._id.toString(), card));
    // collection.cards = Array.from(uniqueCardsMap.values());

    res
      .status(200)
      .json({ message: 'Cards updated in collection successfully.', data: collection });
  } catch (error) {
    console.error('Error updating cards in collection:', error);
    next(error);
  }
};
exports.checkAndUpdateCardPrices = async (req, res, next) => {
  const { allUserIds } = fetchUserIdsFromUserSecurityData();
  if (allUserIds && allUserIds.length > 0) {
    console.log('SECTION Z: COMPLETE'.green, allUserIds);
  }
  let priceChanges = [];
  for (const userId of allUserIds) {
    const userPopulated = await populateUserDataByContext(userId, ['collections']);
    for (const collection of userPopulated.allCollections) {
      for (const card of collection.cards) {
        const apiPrice = await fetchCardPrices(card.name); // Implement fetchCardPrices
        card.price = apiPrice;
        if (card.latestPrice.num !== apiPrice) {
          card.latestPrice.num = apiPrice;
          card.priceHistory.push({ timestamp: new Date(), num: apiPrice });
          await card.save();
          priceChanges.push(
            `Card: ${card.name}, Old Price: ${card.latestPrice.num}, New Price: ${apiPrice}`,
          );
        } else {
          // Push current value to dailyPriceHistory if no change
          card.dailyPriceHistory.push({ timestamp: new Date(), num: card.latestPrice.num });
          await card.save();
        }
      }
    }
  }
};

// !--------------------------! COLLECTIONS !--------------------------!
