const { default: mongoose } = require('mongoose');
const { getCardInfo } = require('../../utils/utils.js');
const logger = require('../../configs/winston.js');
const { infoLogger } = require('../../middleware/loggers/logInfo.js');
const User = require('../../models/User.js');
const { axiosInstance } = require('../../utils/utils.js');
const {
  createAndSaveCardInContext,
  createAndSaveCard,
  selectFirstVariant,
} = require('./helpers2.js');
// !--------------------------! USERS !--------------------------!
async function setCollectionModel(Model, collectionName, userId, collectionData = {}) {
  const collection = new Model({
    ...collectionData,
    userId,
    name: collectionData.name || collectionName,
  });
  await collection.save();
  return collection;
}
async function createDefaultCollectionsAndCards(userId) {
  // Collection types remain unchanged
  const collectionTypes = [
    { type: Collection, name: 'My First Collection' },
    { type: Deck, name: 'My First Deck' },
    { type: Cart, name: 'My First Cart' },
  ];

  const updatedCollectionTypes = [];

  for (const collectionType of collectionTypes) {
    // Unchanged collection creation logic
    const collection = await setCollectionModel(collectionType.type, collectionType.name, userId);
    updatedCollectionTypes.push(collection);

    // Fetch default card data and create cards in context
    const defaultCards = await cardController.fetchAndTransformCardData('dark magician');
    logger.info(`Fetched default card data: ${defaultCards[0].name}`);

    const cardInContext = await createAndSaveCardInContext(
      defaultCards[0],
      collection._id,
      `CardIn${collection.name}`,
      collection.name,
    );
    logger.info(`Created default card for ${collection.name}: ${cardInContext.name}`);

    // Push card ID to collection and save
    collection.cards.push(cardInContext._id);
    await collection.save();
    logger.info(`Saved updated ${collection.name}`);
  }

  return {
    defaultCollection: updatedCollectionTypes[0],
    defaultDeck: updatedCollectionTypes[1],
    defaultCart: updatedCollectionTypes[2],
  };
}
async function reFetchForSave(card, collectionId, collectionModel, cardModel) {
  if (!card) {
    throw new Error('Card is required in reFetchForSave');
  }
  const response = await getCardInfo(card?.name);
  // const cardData = response.data;
  // return await createAndSaveCard(response, collectionId, collectionModel, cardModel, 'refetch');
  return await createAndSaveCard(response, {
    collectionId,
    collectionModel,
    cardModel,
    tag: 'random',
  });
}
async function fetchAndSaveRandomCard(collectionId, collectionModel, cardModel) {
  const endpoint = 'randomcard.php';
  const response = await axiosInstance.get(endpoint);
  const cardData = response.data;
  return await createAndSaveCard(cardData, {
    collectionId,
    collectionModel,
    cardModel,
    tag: 'random',
  });
}
const setupDefaultCollectionsAndCards = async (user, collectionModel, collectionData) => {
  if (collectionModel) {
    const newCollection = await setCollectionModel(
      mongoose.model(collectionModel),
      `${collectionModel} Name`,
      user._id,
      collectionData,
    );

    const randomCardData = await fetchAndSaveRandomCard(
      newCollection._id,
      collectionModel,
      `CardIn${collectionModel}`,
    );

    newCollection.cards.push(randomCardData._id);
    await newCollection.save();
    infoLogger('[SECTION X-0] COMPLETE: CREATE DEFAULT COLLECTIONS AND CARDS');
    return newCollection;
  } else {
    const { defaultCollection, defaultDeck, defaultCart } = await createDefaultCollectionsAndCards(
      user._id,
    );
    user.allCollections.push(defaultCollection._id);
    user.allDecks.push(defaultDeck._id);
    user.cart = defaultCart._id;

    infoLogger('[SECTION X-1] COMPLETE: PUSH DEFAULT COLLECTIONS AND CARDS TO USER');
    logger.info('User: ', user);
    infoLogger('[SECTION X-2] COMPLETE: SAVE USER');
  }
};
/**
 * [SECTION 0] Helper functions for different methods
 * Function to create default collections and cards for a new user
 * @param {*} newUser
 * @returns {void}
 */
async function fetchUserIdsFromUserSecurityData() {
  // infoLogger('SECTION X-3: FETCH USER IDS');
  const users = await User.find({}).select('_id'); // This query retrieves all users but only their _id field
  const allUserIds = [];
  const userIds = users.map((user) => user._id); // Extract the _id field from each user document
  allUserIds.push(...userIds);

  infoLogger('SECTION X-4: COMPLETE'.yellow);

  return { userIdData: users, allUserIds };
}
const fetchAllCollectionIds = async (userId) => {
  const user = await User.findById(userId).populate('allCollections');
  const allIds = [];
  infoLogger(`${user.allCollections}`.yellow);
  user.allCollections.forEach((collection) => {
    allIds.push(collection._id);
  });

  infoLogger(`${allIds}`.yellow, allIds);
  return allIds;
};

module.exports = {
  createDefaultCollectionsAndCards,
  selectFirstVariant,
  setupDefaultCollectionsAndCards,
  fetchUserIdsFromUserSecurityData,
  reFetchForSave,
  fetchAllCollectionIds,
};
