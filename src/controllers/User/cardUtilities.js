const { reFetchForSave } = require("./helpers");

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
    console.log(`Processing card: ${cardData.id}`);
    let foundCard = entity.cards.find((c) => c.id.toString() === cardData.id);

    if (foundCard) {
      let cardInEntity = await cardModel.findById(foundCard._id);
      if (cardInEntity) {
        console.log(`Updating existing card: ${cardInEntity.name}`);
        cardInEntity.quantity += 1;
        cardInEntity.totalPrice = cardInEntity.quantity * cardInEntity.price;
        await cardInEntity.save();
        entity.totalQuantity += cardData.quantity;
        entity.totalPrice += cardData.quantity * cardInEntity.price;
      } else {
        console.log(`Card not found in ${entityType}:`, foundCard._id);
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
