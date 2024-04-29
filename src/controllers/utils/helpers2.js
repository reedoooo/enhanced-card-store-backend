const { constructCardDataObject } = require('../../utils/utils');
const { CardSet, CardVariant, UserSecurityData, UserBasicData } = require('../../models');
const { default: mongoose } = require('mongoose');
const logger = require('../../configs/winston');
const bcrypt = require('bcrypt');
const { User } = require('../../models/User');

async function registerUser(username, password, email, firstName, lastName) {
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  const userSecurityData = new UserSecurityData({
    username,
    password: hashedPassword,
    email,
    role_data: {
      name: 'admin',
      capabilities: [
        'read',
        'write',
        'delete',
        'update',
        // 'create',
        // 'admin',
      ],
    },
  });
  const userBasicData = new UserBasicData({
    firstName,
    lastName,
  });
  // PROMISE ALL: this will wait for all promises to be resolved before returning
  await Promise.all([userSecurityData.save(), userBasicData.save()]);
  const newUser = new User({
    username,
    email,
    loginStatus: true,
    lastUpdated: new Date(),
    userSecurityData: userSecurityData._id,
    userBasicData: userBasicData._id,
    // userSecurityData: newUserSecurityData._id,
    // userBasicData: newUserBasicData._id
  });
  await newUser.save();
  return newUser;
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
  // logger.info(`Creating ${cardSetsData} ${CardSet.modelName} entities ...`);
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
  logger.info(`SETIDS TYPE: ${typeof cardSetIds}`);
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
/**
 * Creates and saves a card in the given context.
 *
 * @param {Object} cardData - The data for the card.
 * @param {Object} collectionData - The data for the collection.
 * @param {string} cardModel - The model for the card.
 * @param {string} collectionModel - The model for the collection.
 * @param {string} collectionId - The ID of the collection.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the created card instance and collection instance.
 * @throws {Error} - If any of the required parameters are missing.
 */
async function createAndSaveCardInContext(
  cardData,
  collectionData,
  cardModel,
  collectionModel,
  collectionId,
) {
  if (!cardData || !collectionId || !cardModel || !collectionModel) {
    throw new Error('Missing required parameters for creating a card in context.');
  }
  logger.info(
    `ALL INCOMING PARAMS: ${cardData}, ${collectionData}, ${cardModel}, ${collectionModel}, ${collectionId}`,
  );
  // Constructing the card data with additional context
  const mappedData = mapCardDataToModelFields(cardData, collectionId, collectionModel, cardModel);

  // Initializing the card model based on the provided cardModel string
  const CollectionModel = mongoose.model(collectionModel);
  const collectionInstance = new CollectionModel(collectionData);
  // await saveModel(CollectionModel, collectionInstance);

  // Initializing the card model based on the provided cardModel string
  const CardModel = mongoose.model(cardModel);
  const cardInstance = new CardModel(mappedData);
  await createCardSetsAndVariants(cardInstance, cardData, cardModel);
  // Creating card sets and variants, then setting additional details based on these entities
  // const { cardSetIds, cardVariantIds } = await createCardSetsAndVariants(
  //   cardInstance,
  //   cardData,
  //   cardModel,
  //   // cardData.card_sets,
  //   // cardData.card_sets, // Assuming you meant to pass card variant data here, adjust as necessary
  //   // cardModel,
  //   // cardInstance._id,
  // );

  // Set additional properties based on the created sets and variants
  setAltArtDetails(cardInstance);
  // cardInstance.card_sets = cardSetIds;
  // cardInstance.cardVariants = cardVariantIds;
  cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);
  await cardInstance.populate('variant');
  cardInstance.rarity = cardInstance.variant?.rarity;
  // Populate the 'variant' field for detailed information, if necessary
  // await cardInstance.populate('variant');
  // cardInstance.rarity = cardInstance.variant?.rarity;

  // Save the card instance to the database
  await saveModel(CardModel, cardInstance);
  if (collectionModel === 'Cart') {
    // Add the card instance to the collection instance
    collectionInstance.items.push(cardInstance._id);
  } else {
    collectionInstance.cards.push(cardInstance._id);
  }
  // Save the collection instance to the database
  await saveModel(CollectionModel, collectionInstance);

  return { cardInstance, collectionInstance };
}

module.exports = {
  // USER ROUTES
  registerUser,
  // CARD MODELS
  createAndSaveCard,
  createCardSetsAndVariants,
  selectFirstVariant,
  setAltArtDetails,
  mapCardDataToModelFields,
  createAndSaveCardInContext,
  // CARD ROUTES
  // addOrUpdateCards,
  // removeCards,
};
