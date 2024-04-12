const { default: mongoose } = require('mongoose');
const { getCardInfo } = require('../../utils/utils.js');
const logger = require('../../configs/winston.js');
const { infoLogger } = require('../../middleware/loggers/logInfo.js');
const User = require('../../models/User.js');
const { axiosInstance } = require('../../utils/utils.js');
const {
  createAndSaveCardInContext,
  createAndSaveCard,
  // selectFirstVariant,
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
/**
 * Removes duplicate cards from an entity's cards array and updates the original card's quantity.
 * @param {Object} entity - The entity containing the cards to be deduplicated.
 * @param {Model} cardModel - The Mongoose model of the card being deduplicated.
 */
async function deDuplicate(entity, cardModel) {
  // Create a map to track occurrences of card ids
  const cardOccurrenceMap = new Map();

  // Iterate in reverse to prioritize older cards over newer duplicates
  for (let i = entity?.cards?.length - 1; i >= 0; i--) {
    const cardId = entity?.cards[i]?.id?.toString();
    if (cardOccurrenceMap.has(cardId)) {
      // Found a duplicate, remove it and update quantity of the original card
      let originalCard = await cardModel.findById(cardOccurrenceMap.get(cardId));
      originalCard.quantity += 1;
      originalCard.totalPrice = originalCard.quantity * originalCard.price;
      await originalCard.save();

      // Remove the duplicate card from the entity's cards array
      entity?.cards?.splice(i, 1);
    } else {
      // Not a duplicate, add to map with its database ID
      cardOccurrenceMap.set(cardId, entity.cards[i]._id);
    }
  }
}
/**
 * Dynamically adds cards to either a deck or collection based on the context.
 * @param {Object} target - The deck or collection from which to add cards.
 * @param {Array} cards - Array of card objects to be added.
 * @param {String} entityId - The id of the entity to which the cards are being added.
 * @param {String} entityType - The type of entity to which the cards are being added.
 * @param {String} cardModel - The name of the card model to be used.
 * @returns {Promise<Object>} - The updated entity.
 * */
async function addOrUpdateCards(entity, cards, entityId, entityType, cardModel) {
  for (const cardData of cards) {
    logger.info(`Processing card: ${cardData.id}`);
    logger.info(`NAME: ${cardData.name}`);
    logger.info(`GEN: ${cardData}`, cardData.red);
    let foundCard = entity?.cards?.find((c) => c.id.toString() === cardData.id);

    if (foundCard) {
      let cardInEntity = await cardModel.findById(foundCard._id);
      if (cardModel === 'CardInDeck' && cardInEntity.quantity === 3) {
        throw new Error(
          `Cannot add card ${cardInEntity?.name} to deck ${target.name} as this card is already at max quantity.`,
        );
      }
      if (cardInEntity) {
        logger.info(
          `Updating existing card: ${cardInEntity.name} with quantity: ${cardInEntity.quantity.yellow}`,
          cardInEntity,
        );
        cardInEntity.quantity = cardInEntity.quantity + 1;
        // cardInEntity.quantity ++;
        cardInEntity.totalPrice = cardInEntity.quantity * cardInEntity.price;
        await cardInEntity.save();
        logger.info(
          `Updated card: ${cardInEntity.name} with quantity: ${cardData.quantity.green}`,
          cardData.quantity,
        );
        entity.totalQuantity += cardData.quantity;
        entity.totalPrice += cardData.quantity * cardInEntity.price;

        // Update card totals for the new card
        // entity.totalQuantity += 1;
        // entity.totalPrice += cardData.price;
      } else {
        logger.info(`Card not found in ${entityType}:`, foundCard._id);
      }
    } else {
      if (!cardData.price) {
        cardData.price = cardData.card_prices[0]?.tcgplayer_price;
      }

      // Assuming reFetchForSave is a utility that creates or updates a card instance based on the provided data
      const reSavedCard = await reFetchForSave(cardData, entityId, entityType, cardModel.modelName);
      entity?.cards?.push(reSavedCard?._id);
    }
  }
  await deDuplicate(entity, cardModel);

  await entity?.save();
  return entity;
}
/**
 * Dynamically removes cards from either a deck or collection based on the context.
 * @param {Object} target - The deck or collection from which to remove cards.
 * @param {Array} cardsToRemove - Array of card objects to be removed.
 * @param {String} entityId - The id of the entity to which the cards are being removed
 * @param {String} context - The context indicating whether we're working with a "deck" or "collection".
 * @param {Model} cardModel - The Mongoose model corresponding to the context (CardInDeck or CardInCollection).
 * @returns {Promise<Object>} - The updated entity.
 */
async function removeCards(target, entityId, cardsToRemove, context, cardModel) {
  if (!Array.isArray(cardsToRemove)) {
    throw new Error('Invalid card data, expected an array.');
  }
  logger.info(`Removing ${cardsToRemove.length} cards from ${context} ${target.name}`);

  // Extract card IDs to be removed.
  const cardIdsToRemove = cardsToRemove.map((card) => card._id);

  // Filter out the cards to be removed from the target (deck or collection).
  // target.cards = target.cards.filter((card) => !cardIdsToRemove.includes(card.id.toString()));

  // Perform the deletion in the corresponding card model.
  await cardModel.deleteMany({
    _id: { $in: cardIdsToRemove },
    [`${context}Id`]: target._id,
  });

  // Save the changes to the target (deck or collection).
  await target.save();
  return target;
}
module.exports = {
  createDefaultCollectionsAndCards,
  // selectFirstVariant,
  setupDefaultCollectionsAndCards,
  fetchUserIdsFromUserSecurityData,
  reFetchForSave,
  fetchAllCollectionIds,
  addOrUpdateCards,
  removeCards,
};
