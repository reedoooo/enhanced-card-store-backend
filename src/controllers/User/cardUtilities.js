const logger = require("../../configs/winston");
const { reFetchForSave } = require("./helpers");
/**
 * Removes duplicate cards from an entity's cards array and updates the original card's quantity.
 * @param {Object} entity - The entity containing the cards to be deduplicated.
 * @param {Model} cardModel - The Mongoose model of the card being deduplicated.
 */
async function deDuplicate(entity, cardModel) {
  // Create a map to track occurrences of card ids
  const cardOccurrenceMap = new Map();

  // Iterate in reverse to prioritize older cards over newer duplicates
  for (let i = entity.cards.length - 1; i >= 0; i--) {
    const cardId = entity.cards[i].id.toString();
    if (cardOccurrenceMap.has(cardId)) {
      // Found a duplicate, remove it and update quantity of the original card
      let originalCard = await cardModel.findById(cardOccurrenceMap.get(cardId));
      originalCard.quantity += 1;
      originalCard.totalPrice = originalCard.quantity * originalCard.price;
      await originalCard.save();

      // Remove the duplicate card from the entity's cards array
      entity.cards.splice(i, 1);
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
async function addOrUpdateCards(
  entity,
  cards,
  entityId,
  entityType,
  cardModel
) {
  for (const cardData of cards) {
    logger.info(`Processing card: ${cardData.id}`);
    let foundCard = entity.cards.find((c) => c.id.toString() === cardData.id);

    if (foundCard) {
      let cardInEntity = await cardModel.findById(foundCard._id);
      if (cardModel === 'CardInDeck' && cardInEntity.quantity === 3) {
        throw new Error(
          `Cannot add card ${cardInEntity?.name} to deck ${target.name} as this card is already at max quantity.`
        );
      }
      if (cardInEntity) {
        logger.info(`Updating existing card: ${cardInEntity.name}`);
        cardInEntity.quantity += 1;
        cardInEntity.totalPrice = cardInEntity.quantity * cardInEntity.price;
        await cardInEntity.save();
        entity.totalQuantity += cardData.quantity;
        entity.totalPrice += cardData.quantity * cardInEntity.price;
      } else {
        logger.info(`Card not found in ${entityType}:`, foundCard._id);
      }
    } else {
      if (!cardData.price) {
        cardData.price = cardData.card_prices[0]?.tcgplayer_price;
      }

      // Assuming reFetchForSave is a utility that creates or updates a card instance based on the provided data
      const reSavedCard = await reFetchForSave(
        cardData,
        entityId,
        entityType,
        cardModel.modelName
      );
      entity.cards.push(reSavedCard?._id);
    }
  }
  await deDuplicate(entity, cardModel);

  await entity.save();
  return entity;
}
/**
 * Dynamically removes cards from either a deck or collection based on the context.
 * @param {Object} target - The deck or collection from which to remove cards.
 * @param {Array} cardsToRemove - Array of card objects to be removed.
 * @param {String} context - The context indicating whether we're working with a "deck" or "collection".
 * @param {Model} cardModel - The Mongoose model corresponding to the context (CardInDeck or CardInCollection).
 */
async function removeCards(target, cardsToRemove, context, cardModel) {
  if (!Array.isArray(cardsToRemove)) {
    throw new Error("Invalid card data, expected an array.");
  }

  // Extract card IDs to be removed.
  const cardIdsToRemove = cardsToRemove.map((card) => card._id);

  // Filter out the cards to be removed from the target (deck or collection).
  target.cards = target.cards.filter(
    (card) => !cardIdsToRemove.includes(card.id.toString())
  );

  // Perform the deletion in the corresponding card model.
  await cardModel.deleteMany({
    _id: { $in: cardIdsToRemove },
    [`${context}Id`]: target._id,
  });

  // Save the changes to the target (deck or collection).
  await target.save();
}

module.exports = {
	addOrUpdateCards,
  removeCards,
}
