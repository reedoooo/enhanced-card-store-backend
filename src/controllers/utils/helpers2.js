const { constructCardDataObject } = require('../../utils/utils');
const { CardSet, CardVariant } = require('../../models');
const { default: mongoose } = require('mongoose');
const logger = require('../../configs/winston');
const bcrypt = require('bcrypt');
const { UserSecurityData, UserBasicData, GeneralUserStats, User } = require('../../models');
const { generateToken, generateRefreshToken, saveTokens } = require('../../middleware/auth');
const { reFetchForSave } = require('./helpers');
async function createUser(username, password, email, role_data, firstName, lastName) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUserSecurityData = new UserSecurityData({
    username,
    password: hashedPassword,
    email,
    role_data,
  });
  const newUserBasicData = new UserBasicData({ firstName, lastName });

  const newUser = new User({
    username,
    email,
    loginStatus: true,
    lastUpdated: new Date(),
    userSecurityData: newUserSecurityData._id,
    userBasicData: newUserBasicData._id,
  });

  await Promise.all([newUserSecurityData.save(), newUserBasicData.save(), newUser.save()]);
  return { newUser };
}
async function createUserValidationData(user) {
  const accessToken = await generateToken(user._id);
  const refreshToken = await generateRefreshToken(user._id);

  const { savedAccessToken, savedRefreshToken } = await saveTokens(
    user._id,
    accessToken,
    refreshToken,
  );

  const verifiedUser = await User.findById(user._id)
    .populate('userSecurityData')
    .populate('userBasicData');

  verifiedUser.userSecurityData.accessToken = savedAccessToken;
  verifiedUser.userSecurityData.refreshToken = savedRefreshToken;
  await verifiedUser.save();

  return verifiedUser;
}
async function saveModel(Model, data) {
  const modelInstance = new Model(data);
  await modelInstance.save();
  return modelInstance;
}
async function createCardVariants(sets, cardModel, cardId) {
  return Promise.all(
    sets.map(async (setId, index) => {
      const set = await CardSet.findById(setId);
      if (!set) throw new Error(`CardSet not found for ID: ${setId}`);

      const cardVariant = new CardVariant({
        ...set.toObject(),
        // set: setId && setId.toString(),
        selected: false,
        alt_art_image_url: '',
        set: setId,
        cardModel,
        cardId,
        variant: index + 1,
        price: set.set_price,
        rarity: set.set_rarity,
        rarity_code: set?.set_rarity_code,
      });

      await cardVariant.save();
      return cardVariant._id;
    }),
  );
}
function transformSetData(set, index, { cardModel, cardId }) {
  const setPrice = mongoose.Types.Decimal128.fromString(set.set_price.replace(/^\$/, ''));
  return { ...set, set_price: setPrice, cardModel, cardId };
}
async function createCardSets(cardSetsData, cardModel, cardId) {
  logger.info(`Creating ${cardSetsData} ${CardSet.modelName} entities ...`);
  return Promise.all(
    cardSetsData
      ?.map((set, index) => transformSetData(set, index, { cardModel, cardId }))
      ?.map(async (set) => {
        // Now that set is prepared, create and save the CardSet document.
        const cardSet = new CardSet(set);
        await cardSet.save();
        return cardSet._id;
      }),
  );
}
async function createCardSetsAndVariants(cardInstance, cardData, cardModel) {
  if (!cardData || !cardInstance || !cardModel) {
    throw new Error('Invalid input for creating sets and variants.');
  }
  const cardSetIds = await createCardSets(cardData?.card_sets, cardModel, cardInstance._id);
  logger.info(`Created ${cardSetIds.length} sets for card ${cardInstance._id}`);
  cardInstance.card_sets = cardSetIds;
  const cardVariantIds = await createCardVariants(cardSetIds, cardModel, cardInstance._id); // This might need adjustment based on your data structure.
  logger.info(`Created ${cardVariantIds.length} variants for card ${cardInstance._id}`);
  cardInstance.cardVariants = cardVariantIds;
}
function selectFirstVariant(cardVariants) {
  return cardVariants.length > 0 ? cardVariants[0] : null;
}
function setAltArtDetails(card) {
  if (!card || !card.card_images || !card.id) {
    throw new Error('Invalid card data for setting alt art details.');
  }

  const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
  if (altArtImage) {
    card.variant.alt_art_image_url = altArtImage.image_url;
  }

  card.alt_art_ids = card.card_images.filter((img) => img.id !== card.id).map((img) => img.id);
}
function mapCardDataToModelFields(cardData, collectionId, collectionModel, cardModel) {
  if (!cardData || !collectionId || !collectionModel || !cardModel) {
    throw new Error('Invalid input for mapping card data.');
  }

  const contextualFields = {}; // Define or extract these as needed
  return constructCardDataObject(cardData, {
    collectionId,
    collectionModel,
    cardModel,
    contextualFields,
  });
}
async function createAndSaveCard(cardData, additionalData) {
  if (!cardData || !additionalData) {
    throw new Error('Missing required parameters for creating a card.', 400);
  }

  const { collectionId, collectionModel, cardModel, tag } = additionalData;
  const CardModel = mongoose.model(cardModel);
  const mappedData = mapCardDataToModelFields(cardData, collectionId, collectionModel, cardModel);

  const cardInstance = new CardModel(mappedData);
  await createCardSetsAndVariants(cardInstance, cardData, cardModel);
  setAltArtDetails(cardInstance);
  cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);
  await cardInstance.populate('variant');
  cardInstance.rarity = cardInstance.variant?.rarity;
  await saveModel(CardModel, cardInstance); // Assuming saveModel handles saving the instanc
  return cardInstance;
}
async function createAndSaveCardInContext(cardData, collectionId, cardModel, collectionModel) {
  if (!cardData || !collectionId || !cardModel || !collectionModel) {
    throw new Error('Missing required parameters for creating a card in context.');
  }

  // Constructing the card data with additional context
  const mappedData = mapCardDataToModelFields(cardData, collectionId, collectionModel, cardModel);

  // Initializing the card model based on the provided cardModel string
  const CardModel = mongoose.model(cardModel);
  const cardInstance = new CardModel(mappedData);

  // Creating card sets and variants, then setting additional details based on these entities
  const { cardSetIds, cardVariantIds } = await createCardSetsAndVariants(
    cardData.card_sets,
    cardData.card_sets, // Assuming you meant to pass card variant data here, adjust as necessary
    cardModel,
    cardInstance._id,
  );

  // Set additional properties based on the created sets and variants
  setAltArtDetails(cardInstance);
  cardInstance.card_sets = cardSetIds;
  cardInstance.cardVariants = cardVariantIds;
  cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);

  // Populate the 'variant' field for detailed information, if necessary
  await cardInstance.populate('variant');
  cardInstance.rarity = cardInstance.variant?.rarity;

  // Save the card instance to the database
  await saveModel(CardModel, cardInstance);

  return cardInstance;
}
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
  // USER ROUTES
  createUser,
  createUserValidationData,
  // CARD MODELS
  createAndSaveCard,
  createCardSetsAndVariants,
  selectFirstVariant,
  setAltArtDetails,
  mapCardDataToModelFields,
  createAndSaveCardInContext,
  // CARD ROUTES
  addOrUpdateCards,
  removeCards,
};
