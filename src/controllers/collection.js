// !--------------------------! COLLECTIONS !--------------------------!
const { CardInCollection } = require('../models/Card');
const { Collection } = require('../models/Collection');
const {
  populateUserDataByContext,
  fetchPopulatedUserContext,
  findUserContextItem,
} = require('./utils/dataUtils');
const { setupDefaultCollectionsAndCards, fetchAllCollectionIds } = require('./utils/helpers');
const logger = require('../configs/winston');
const { sendJsonResponse } = require('../utils/utils');
const { addOrUpdateCards, removeCards } = require('./utils/helpers2');
const { validateContextEntityExists } = require('../middleware/errorHandling/validators');
const { handleError } = require('../middleware/errorHandling/errorHandler');
const { infoLogger } = require('../middleware/loggers/logInfo');

// ! COLLECTION ROUTES (GET, CREATE, UPDATE, DELETE) !
/**
 * Returns all collections for a user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
exports.getAllCollectionsForUser = async (req, res, next) => {
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['collections']);
  validateContextEntityExists(populatedUser, 'User not found', 404, res);

  sendJsonResponse(
    res,
    200,
    `Fetched collections for user ${req.params.userId}`,
    populatedUser.allCollections,
  );
};
/**
 * Creates a new collection for a user.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
exports.createNewCollection = async (req, res, next) => {
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['collections']);
  const newCollection = await setupDefaultCollectionsAndCards(
    populatedUser,
    'Collection',
    req.body,
  );
  populatedUser.allCollections.push(newCollection._id);
  await populatedUser.save();

  const populatedCollection = await Collection.findById(newCollection._id).populate('cards');
  sendJsonResponse(res, 201, 'New collection created successfully', populatedCollection);
};
/**
 * Updates a collection for a user and syncs the collection's cards with the database.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 * @todo Update this to use the new CardInCollection schema
 */
exports.updateExistingCollection = async (req, res, next) => {
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['collections']);
  const collection = findUserContextItem(populatedUser, 'allCollections', req.params.collectionId);
  Object.assign(collection, req.body.updatedCollectionData);
  await collection.save();

  sendJsonResponse(res, 200, 'Collection updated successfully', collection);
};
/**
 * Deletes a collection for a user and removes the collection from the user's collections.
 * Optionally, you might want to delete the collection from the Collection model as well.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 * @todo Optionally, you might want to delete the collection from the Collection model as well.
 * @todo Update this to use the new CardInCollection schema
 */
exports.deleteExistingCollection = async (req, res, next) => {
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['collections']);
  infoLogger(`Deleting collection: ${req.params.collectionId}`, req.params.collectionId);
  populatedUser.allCollections = populatedUser.allCollections.filter(
    (c) => c._id.toString() !== req.params.collectionId,
  );
  await Collection.findByIdAndDelete(req.params.collectionId);
  await populatedUser.save();

  infoLogger('Collection deleted successfully:', req.params.collectionId);
  // const { collectionIds } = fetchAllCollectionIds(populatedUser._id);
  // infoLogger(`All Collection IDS: ${collectionIds}`, collectionIds);
  // sendJsonResponse(res, 200, 'Collection deleted successfully', collectionIds);
  sendJsonResponse(res, 200, 'Collection deleted successfully', {
    data: req.params.collectionId,
  });
};
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
  const cardsArray = Array.isArray(cards) ? cards : [cards];
  const populatedUser = await fetchPopulatedUserContext(userId, ['collections']);
  const collection = findUserContextItem(populatedUser, 'allCollections', collectionId);

  // Utilize addOrUpdateCards utility
  const updatedCollection = await addOrUpdateCards(
    collection,
    cardsArray,
    collectionId,
    'Collection',
    CardInCollection,
  );

  // Send back the updated collection data
  await populatedUser.save();
  // await collection.populate({ path: 'cards', model: 'CardInCollection' });

  sendJsonResponse(res, 200, 'Cards added to collection successfully.', {
    data: updatedCollection,
  });
};
/**
 * Removes cards from a collection and returns the updated collection data.
 * @param {Object} req - The request object
 * @param {Array} req.body.cards - The IDs of the cards to remove
 * @param {string} req.body.type - The type of removal to perform. Options: 'decrement', 'delete'
 * @param {string} req.params.userId - The ID of the user
 * @param {string} req.params.collectionId - The ID of the collection
 * @param {Response} res - The response object
 */
exports.removeCardsFromCollection = async (req, res) => {
  const { cards, type } = req.body; // Include type in the request body
  const cardsArray = Array.isArray(cards) ? cards : [cards];
  const populatedUser = await populateUserDataByContext(req.params.userId, ['collections']);
  const collection = findUserContextItem(populatedUser, 'allCollections', req.params.collectionId);
  if (!collection) {
    return res.status(404).json({ message: 'Collection not found.' });
  }
  if (['decrement', 'delete'].includes(type)) {
    const updatedCollection = await removeCards(
      collection,
      req.params.collectionId,
      cardsArray,
      'collection',
      CardInCollection,
    );
    logger.info(`COLLECTION: ${req.params.collectionId} CARDS: ${updatedCollection.cards}`);
  } else {
    return res.status(400).json({ message: 'Invalid type specified.' });
  }

  await collection.save();
  await populatedUser.save();
  const updatedCollection = populatedUser.allCollections.find(
    (coll) => coll._id.toString() === req.params.collectionId,
  );
  logger.info(`COLLECTION: ${req.params.collectionId} CARDS: ${updatedCollection.cards}`);
  res.status(200).json({
    message: `Cards ${type === 'delete' ? 'removed' : 'updated'} from collection successfully.`,
    data: updatedCollection,
  });
};
/**
 * Deletes a specific card from a collection for a user.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 */
exports.deleteCardFromCollection = async (req, res, next) => {
  try {
    const { userId, collectionId, cardId } = req.params;
    // Fetch the user and the specified collection
    const populatedUser = await fetchPopulatedUserContext(userId, ['collections']);
    const collection = findUserContextItem(populatedUser, 'allCollections', collectionId);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found.' });
    }

    // Assuming cards are stored as an array of references or subdocuments in the collection
    const cardIndex = collection.cards.findIndex((c) => c._id.toString() === cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ message: 'Card not found in collection.' });
    }

    // Remove the card from the collection
    collection.cards.splice(cardIndex, 1);
    await collection.save();

    // Optionally, you might want to delete the card from the CardInCollection model as well
    await CardInCollection.findByIdAndDelete(cardId);

    // Log the operation
    logger.info(`Card ${cardId} removed from collection ${collectionId} for user ${userId}`);

    return res.status(200).json({
      message: 'Card deleted from collection successfully.',
      data: { collectionId, cardId },
    });
  } catch (error) {
    handleError(error, res);
    next(error);
  }
};
/**
 * Decrements the quantity of a specific card in a collection for a user.
 * If the quantity reaches 0, the card may be optionally removed from the collection.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 */
exports.decrementCardQuantityInCollection = async (req, res, next) => {
  try {
    const { userId, collectionId, cardId } = req.params;
    // Assuming `fetchPopulatedUserContext` populates the collections along with their cards
    const populatedUser = await fetchPopulatedUserContext(userId, ['collections']);
    const collection = findUserContextItem(populatedUser, 'allCollections', collectionId);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found.' });
    }

    // Find the card in the collection
    const card = collection.cards.find((c) => c._id.toString() === cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found in collection.' });
    }

    // Decrement the card's quantity
    if (card.quantity > 1) {
      card.quantity -= 1;
      await CardInCollection.findByIdAndUpdate(cardId, { quantity: card.quantity });

      await collection.save(); // Save the collection with the updated card quantity
      await populatedUser.save(); // Save the user with the updated collection

      logger.info(
        `Card ${cardId} quantity decremented in collection ${collectionId} for user ${userId}`,
      );
      res.status(200).json({
        message: 'Card quantity decremented successfully.',
        data: { collectionId, cardId, newQuantity: card.quantity },
      });
    } else {
      // Optionally remove the card if its quantity reaches 0
      const cardIndex = collection.cards.findIndex((c) => c._id.toString() === cardId);
      collection.cards.splice(cardIndex, 1);
      await CardInCollection.findByIdAndDelete(cardId);

      await collection.save(); // Save the collection without the removed card

      await populatedUser.save(); // Save the user with the updated collection
      // Optionally, remove the card from CardInCollection if needed
      logger.info(
        `Card ${cardId} removed from collection ${collectionId} after decrementing to zero for user ${userId}`,
      );
      res.status(200).json({
        message: 'Card removed from collection after decrementing quantity to zero.',
        data: { collectionId, cardId },
      });
    }
  } catch (error) {
    handleError(error, res);
    next(error);
  }
};
