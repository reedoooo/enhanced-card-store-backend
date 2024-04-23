// !--------------------! Dependencies !--------------------!
const { default: mongoose } = require('mongoose');
const {
  getCardInfo,
  axiosInstance,
  generateFluctuatingPriceData,
} = require('../../utils/utils.js');
const { User } = require('../../models/User.js');

const {
  createAndSaveCardInContext,
  createAndSaveCard,
  // selectFirstVariant,
} = require('./helpers2.js');
const logger = require('../../configs/winston.js');
const { Collection, Deck, Cart } = require('../../models/Collection.js');
const { cardController } = require('../card.js');
const { RandomCard } = require('../../models/Card.js');
// !--------------------! Data Models !--------------------!
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
    { type: Collection, name: 'My First Collection', typeName: 'Collection' },
    { type: Deck, name: 'My First Deck', typeName: 'Deck' },
    { type: Cart, name: 'My First Cart', typeName: 'Cart' },
  ];

  const updatedCollectionTypes = [];

  for (const collectionType of collectionTypes) {
    // Unchanged collection creation logic
    const collection = await setCollectionModel(collectionType.type, collectionType.name, userId);
    updatedCollectionTypes.push(collection);

    // Fetch default card data and create cards in context
    const defaultCards = await cardController.fetchAndTransformCardData('dark magician');
    logger.info(`Fetched default card data: ${defaultCards[0].name}`);

    const { cardInstance, collectionInstance } = await createAndSaveCardInContext(
      defaultCards[0],
      collection,
      `CardIn${collectionType.typeName}`,
      `${collectionType.typeName}`,
      collection._id,
      // collection.name,
    );
    logger.info(`Created default card for ${collectionInstance.name}: ${cardInstance.name}`);

    // Push card ID to collection and save
    // collection.cards.push(cardInContext._id);
    // await collection.save();
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
  // return await createAndSaveCardInContext(
  //   response,
  //   collectionId,
  //   cardModel,
  //   collectionModel, // Ensures contextual data is passed
  // );
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
  // const cardData = response.data;
  return await createAndSaveCard(cardData, {
    collectionId,
    collectionModel,
    cardModel,
    tag: 'random',
  });
}
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
 * Adds or updates cards for an entity.
 *
 * @param {Object} entity - The entity to add or update cards for.
 * @param {Array} cards - The array of card data to add or update.
 * @param {string} entityId - The ID of the entity.
 * @param {string} entityType - The type of the entity.
 * @param {Object} cardModel - The card model to use for querying and updating cards.
 * @returns {Promise<Object>} - The updated entity.
 */
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
/**
 * Sets up default collections and cards for a user.
 *
 * @param {Object} user - The user object.
 * @param {Object} collectionModel - The collection model object.
 * @param {Object} collectionData - The collection data object.
 * @returns {Promise<Object>} - The newly created collection object.
 */
const setupDefaultCollectionsAndCards = async (user, collectionModel, collectionData) => {
  if (collectionModel && collectionModel !== '') {
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
    logger.info('[SECTION X-0] COMPLETE: CREATE DEFAULT COLLECTIONS AND CARDS');
    return newCollection;
  } else {
    const { defaultCollection, defaultDeck, defaultCart } = await createDefaultCollectionsAndCards(
      user._id,
    );
    user.allCollections.push(defaultCollection._id);
    user.allDecks.push(defaultDeck._id);
    user.cart = defaultCart._id;

    logger.info('[SECTION X-1] COMPLETE: PUSH DEFAULT COLLECTIONS AND CARDS TO USER');
    // logger.info('User: ', user);
    logger.info('[SECTION X-2] COMPLETE: SAVE USER');
  }
};
async function fetchUserIdsFromUserSecurityData() {
  // logger.info('SECTION X-3: FETCH USER IDS');
  const users = await User.find({}).select('_id'); // This query retrieves all users but only their _id field
  const allUserIds = [];
  const userIds = users.map((user) => user._id); // Extract the _id field from each user document
  allUserIds.push(...userIds);

  logger.info('SECTION X-4: COMPLETE'.yellow);

  return { userIdData: users, allUserIds };
}
const fetchAllCollectionIds = async (userId) => {
  const user = await User.findById(userId).populate('allCollections');
  const allIds = [];
  logger.info(`${user.allCollections}`.yellow);
  user.allCollections.forEach((collection) => {
    allIds.push(collection._id);
  });

  logger.info(`${allIds}`.yellow, allIds);
  return allIds;
};
// async function fetchAndGenerateRandomCardData() {
//   const endpoint = 'randomcard.php';
//   const response = await axiosInstance.get(endpoint);
//   const tcgplayerPrice = response?.data?.card_prices[0]?.tcgplayer_price || 0;
//   const chartData24h = {
//     id: '24h',
//     color: '#00f00f',
//     data: generateFluctuatingPriceData(1, 100), // Assuming this function generates your chart data
//   };
//   const chartData7d = {
//     id: '7d',
//     color: '#bb0000',
//     data: generateFluctuatingPriceData(8, 100), // Assuming this function generates your chart data
//   };
//   const chartData30d = {
//     id: '30d',
//     color: '#0000ff',
//     data: generateFluctuatingPriceData(31, 100), // Assuming this function generates your chart data
//   };
//   let newCardData = {
//     image: response?.data?.card_images.length > 0 ? response?.data.card_images[0].image_url : '',
//     quantity: 1,
//     price: tcgplayerPrice,
//     totalPrice: tcgplayerPrice,
//     id: response?.data?.id?.toString() || '',
//     name: response?.data?.name,
//     priceHistory: [],
//     dailyPriceHistory: [],
//     type: response?.data?.type,
//     frameType: response?.data?.frameType,
//     desc: response?.data?.desc,
//     atk: response?.data?.atk,
//     def: response?.data?.def,
//     level: response?.data?.level,
//     race: response?.data?.race,
//     attribute: response?.data?.attribute,
//     averagedChartData: {},
//   };
//   newCardData.averagedChartData['30d'] = chartData30d;
//   newCardData.averagedChartData['7d'] = chartData7d;
//   newCardData.averagedChartData['24h'] = chartData24h;
//   const newCard = new RandomCard(newCardData);
//   await newCard.save();
//   return newCard; // Return the saved card data
// }
module.exports = {
  createDefaultCollectionsAndCards,
  // selectFirstVariant,
  setupDefaultCollectionsAndCards,
  fetchUserIdsFromUserSecurityData,
  reFetchForSave,
  fetchAllCollectionIds,
  addOrUpdateCards,
  removeCards,
  // fetchAndGenerateRandomCardData,
  // fetchAndSaveRandomCard,
  // fetchAndSaveRandomDeck,
  // fetchAndSaveRandomCollection,
};
