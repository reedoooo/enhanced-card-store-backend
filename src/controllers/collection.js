// !--------------------------! COLLECTIONS !--------------------------!
const { CardInCollection } = require('../models/Card');
const { Collection } = require('../models/Collection');
const {
  populateUserDataByContext,
  fetchPopulatedUserContext,
  findUserContextItem,
} = require('./utils/dataUtils');
const { setupDefaultCollectionsAndCards } = require('./utils/helpers');
const logger = require('../configs/winston');
const { sendJsonResponse } = require('../utils/utils');
const { addOrUpdateCards, removeCards } = require('./utils/helpers');
const { validateEntityPresence } = require('../middleware/errorHandling/validators');

// ! COLLECTION ROUTES (GET, CREATE, UPDATE, DELETE) !
/**
 * Returns all collections for a user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
exports.getAllCollectionsForUser = async (req, res, next) => {
  try {
    const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['collections']);
    validateEntityPresence(populatedUser, 'User not found', 404, res);
    await populatedUser.save();

    sendJsonResponse(
      res,
      200,
      `Fetched collections for user ${req.params.userId}`,
      populatedUser.allCollections,
    );
  } catch (error) {
    next(error); // Ensure that any errors are passed along to the error handling middleware
  }
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
  let collection = populatedUser.allCollections.find(
    (c) => c._id.toString() === req.params.collectionId,
  );
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  Object.assign(collection, req.body);
  await collection.save();

  await populatedUser.save();

  sendJsonResponse(res, 200, 'Collection updated successfully', collection);
};
/**
 * Deletes an existing collection for a user.
 * This function fetches the user's context, logs the deletion attempt, filters out the collection to be deleted from the user's list of collections,
 * deletes the collection from the database, saves the updated user context, and finally logs the successful deletion.
 * It then sends a JSON response indicating the successful deletion of the collection.
 *
 * @param {Request} req - The request object, containing the user ID in `req.params.userId` and the collection ID in `req.params.collectionId`.
 * @param {Response} res - The response object used to send back a JSON response.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {Promise<void>} A promise that resolves with no value, indicating the function has completed its execution.
 */
exports.deleteExistingCollection = async (req, res, next) => {
  const populatedUser = await fetchPopulatedUserContext(req.params.userId, ['collections']);
  logger.info(`Deleting collection: ${req.params.collectionId}`, req.params.collectionId);
  populatedUser.allCollections = populatedUser.allCollections.filter(
    (c) => c._id.toString() !== req.params.collectionId,
  );
  await Collection.findByIdAndDelete(req.params.collectionId);
  await populatedUser.save();

  logger.info('Collection deleted successfully:', req.params.collectionId);
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
  const { cards, type } = req.body;
  const cardsArray = Array.isArray(cards) ? cards : [cards];
  const populatedUser = await fetchPopulatedUserContext(userId, ['collections']);
  const collection = findUserContextItem(populatedUser, 'allCollections', collectionId);
  const updatedCollection = await addOrUpdateCards(
    collection,
    cardsArray,
    collectionId,
    'Collection',
    CardInCollection,
    type,
    populatedUser._id,
  );
  await populatedUser.save();
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
  const tcgId = cardsArray[0];
  const validId = collection.cards.find((card) => card.id === tcgId)._id;
  if (['decrement', 'delete'].includes(type)) {
    const updatedCollection = await removeCards(
      collection,
      req.params.collectionId,
      tcgId,
      'Collection',
      CardInCollection,
      type,
      populatedUser._id,
      validId,
    );
    logger.info(`COLLECTION: ${req.params.collectionId} CARDS: ${updatedCollection.name}`);
  } else {
    throw new Error('Invalid type');
  }

  await collection.save();
  await populatedUser.save();
  const updatedCollection = populatedUser.allCollections.find(
    (coll) => coll._id.toString() === req.params.collectionId,
  );
  res.status(200).json({
    message: `Cards removed from collection successfully.`,
    data: updatedCollection,
  });
};
