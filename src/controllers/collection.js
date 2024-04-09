// !--------------------------! COLLECTIONS !--------------------------!
const { CardInCollection } = require('../models/Card');
const { Collection } = require('../models/Collection');
const {
  populateUserDataByContext,
  fetchPopulatedUserContext,
  findUserContextItem,
} = require('./dataUtils');
const { setupDefaultCollectionsAndCards, fetchAllCollectionIds } = require('./User/helpers');
const logger = require('../configs/winston');
const { sendJsonResponse } = require('../utils/utils');
const { addOrUpdateCards, removeCards } = require('./User/cardUtilities');
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
  const { collectionIds } = fetchAllCollectionIds(populatedUser._id);
  infoLogger(`All Collection IDS: ${collectionIds}`, collectionIds);
  sendJsonResponse(res, 200, 'Collection deleted successfully', collectionIds);
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
  try {
    const populatedUser = await fetchPopulatedUserContext(userId, ['collections']);
    const collection = findUserContextItem(populatedUser, 'allCollections', collectionId);

    // Utilize addOrUpdateCards utility
    await addOrUpdateCards(collection, cardsArray, collectionId, 'Collection', CardInCollection);

    await populatedUser.save();
    await collection.populate({ path: 'cards', model: 'CardInCollection' });

    sendJsonResponse(res, 200, 'Cards added to collection successfully.', {
      data: collection,
    });
  } catch (error) {
    logger.error('Error adding cards to collection:', error);
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
  const { cards, type } = req.body; // Include type in the request body
  const cardsArray = Array.isArray(cards) ? cards : [cards];
  try {
    let populatedUser = await populateUserDataByContext(userId, ['collections']);
    const collection = populatedUser.allCollections.find(
      (coll) => coll._id.toString() === collectionId,
    );

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found.' });
    }

    // Check for the 'type' and call removeCards function accordingly
    if (['decrement', 'delete'].includes(type)) {
      await removeCards(collection, cardsArray, 'collection', CardInCollection, type);
    } else {
      return res.status(400).json({ message: 'Invalid type specified.' });
    }

    await populatedUser.save();
    // Re-fetch the populated user to get the updated collections
    populatedUser = await populateUserDataByContext(userId, ['collections']);
    const updatedCollection = populatedUser.allCollections.find(
      (coll) => coll._id.toString() === collectionId,
    );

    res.status(200).json({
      message: `Cards ${type === 'delete' ? 'removed' : 'updated'} from collection successfully.`,
      data: updatedCollection,
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    next(error);
  }
};
