// !--------------------! Dependencies !--------------------!
const { default: mongoose } = require('mongoose');
const { getCardInfo, axiosInstance } = require('../../utils/utils.js');
const { createAndSaveCard } = require('./helpers2.js');
const logger = require('../../configs/winston.js');
const { Collection, Deck, Cart } = require('../../models/Collection.js');
const { cardController } = require('../card.js');
const { CardInCart, CardInCollection, CardInDeck } = require('../../models/Card.js');
const { fetchPopulatedUserContext } = require('./dataUtils.js');
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
  const collectionTypes = [
    { type: Collection, name: 'My First Collection', typeName: 'Collection' },
    { type: Deck, name: 'My First Deck', typeName: 'Deck' },
    { type: Cart, name: 'My First Cart', typeName: 'Cart' },
  ];

  const updatedCollectionTypes = [];

  for (const collectionType of collectionTypes) {
    const collection = await setCollectionModel(collectionType.type, collectionType.name, userId);
    updatedCollectionTypes.push(collection);
    const defaultCards = await cardController.fetchAndTransformCardData('dark magician');
    logger.info(`Fetched default card data: ${defaultCards[0].name}`);
    const { cardInstance, collectionInstance } = await createAndSaveCard(defaultCards[0], {
      collectionId: collection._id,
      collectionModel: `${collectionType.typeName}`,
      cardModel: `CardIn${collectionType.typeName}`,
      tag: 'default',
      collectionData: collection,
    });
    logger.info(`Created default card for ${collectionInstance.name}: ${cardInstance.name}`);
    logger.info(`Saved updated ${collection.name}`);
  }

  return {
    defaultCollection: updatedCollectionTypes[0],
    defaultDeck: updatedCollectionTypes[1],
    defaultCart: updatedCollectionTypes[2],
  };
}
async function reFetchForSave(card, collectionId, collectionModel, cardModelName) {
  if (!card) {
    throw new Error('Card is required in reFetchForSave');
  }
  const response = await getCardInfo(card?.name);
  return await createAndSaveCard(response, {
    collectionId,
    collectionModel,
    cardModelName,
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
async function deDuplicate(entity, cardModel) {
  const cardOccurrenceMap = new Map();
  for (let i = entity?.cards?.length - 1; i >= 0; i--) {
    const cardId = entity?.cards[i]?.id?.toString();
    if (cardOccurrenceMap.has(cardId)) {
      let originalCard = await cardModel.findById(cardOccurrenceMap.get(cardId));
      originalCard.quantity += 1;
      originalCard.totalPrice = originalCard.quantity * originalCard.price;
      await originalCard.save();
      entity?.cards?.splice(i, 1);
    } else {
      cardOccurrenceMap.set(cardId, entity.cards[i]._id);
    }
  }
}
const updateCardQuantity = async (card, quantity, type, user, entityName, entityId) => {
  if (type === 'increment') {
    card.quantity += 1;
  } else if (type === 'decrement' && card.quantity > 1) {
    card.quantity -= 1;
  } else if ((type === 'decrement' && card.quantity === 1) || type === 'delete') {
    switch (entityName) {
      case 'Collection':
        await CardInCollection.findOneAndRemove({ cardId: item.id, userId: user._id });
        const collectionToEdit = user.allCollections.find(
          (collection) => collection._id === entityId,
        );
        collectionToEdit.cards = collectionToEdit.cards.filter(
          (card) => card.id.toString() !== card.id.toString(),
        );
        break;
      case 'Deck':
        await CardInDeck.findOneAndRemove({ cardId: item.id, userId: user._id });
        const deckToEdit = user.allDecks.find((deck) => deck._id === entityId);
        deckToEdit.cards = deckToEdit.cards.filter(
          (card) => card.id.toString() !== card.id.toString(),
        );
        break;
      case 'Cart':
        await CardInCart.findOneAndRemove({ cardId: item.id, userId: user._id });
        user.cart.items = user.cart.items.filter(
          (card) => card.id.toString() !== card.id.toString(),
        );
        break;
      default:
        break;
    }
  }
};
async function addOrUpdateCards(
  entity,
  cards,
  entityId,
  collectionModelName,
  cardModelName,
  updateType,
  userId,
  cardModel,
) {
  try {
    const populatedUser = await fetchPopulatedUserContext(userId, ['collections']);
    for (const cardData of cards) {
      let foundCard = entity?.cards?.find((c) => c.id.toString() === cardData.id);
      if (foundCard) {
        let cardInEntity = await cardModel.findById(foundCard._id);
        if (cardInEntity && updateType === 'increment') {
          logger.info(
            `[UPDATING EXISTING CARD] ${cardInEntity.name} with quantity: ${cardInEntity.quantity}`
              .yellow,
            cardInEntity,
          );
          await updateCardQuantity(
            cardInEntity,
            cardData.quantity,
            updateType,
            populatedUser,
            collectionModelName,
            entityId,
          );
          cardInEntity.totalPrice = cardInEntity.quantity * cardInEntity.price;
          await cardInEntity.save();
          logger.info(`[OLD QUANTITY] ${cardData.quantity}`.yellow, cardData.quantity);
        } else {
          logger.info(`Card not found in ${collectionModelName}:`, foundCard._id);
        }
      } else {
        logger.info(`MODEL NAME: ${cardModelName}`);
        const reSavedCard = await reFetchForSave(
          cardData,
          entityId,
          collectionModelName,
          cardModelName,
        );

        entity?.cards?.push(reSavedCard?._id);
      }
    }
    await deDuplicate(entity, cardModel);
    await entity?.save();
    // logger.info(`Saved ${collectionModelName} ${entity.name}`);
    return entity;
  } catch (error) {
    logger.error(`ERROR IN addOrUpdateCards: ${error.message}`);
    throw error;
  }
}
async function removeCards(
  entity,
  entityId,
  cardToRemoveId,
  context,
  cardModel,
  updateType,
  userId,
  validId,
) {
  let foundCard = entity?.cards?.find((c) => c.id.toString() === cardToRemoveId);
  const populatedUser = await fetchPopulatedUserContext(userId, ['collections']);
  if (foundCard) {
    let cardInEntity = await cardModel.findById(validId);
    await updateCardQuantity(
      cardInEntity,
      cardInEntity.quantity,
      updateType,
      populatedUser,
      context,
      entityId,
    );
  } else {
    logger.info(`Card not found in ${context}:`, foundCard._id);
  }
  await entity.save();
  return entity;
}
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
    return newCollection;
  } else {
    const { defaultCollection, defaultDeck, defaultCart } = await createDefaultCollectionsAndCards(
      user._id,
    );
    user.allCollections.push(defaultCollection._id);
    user.allDecks.push(defaultDeck._id);
    user.cart = defaultCart._id;
  }
};
module.exports = {
  createDefaultCollectionsAndCards,
  setupDefaultCollectionsAndCards,
  reFetchForSave,
  addOrUpdateCards,
  removeCards,
};
