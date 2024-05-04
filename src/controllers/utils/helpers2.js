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
function parseCardSetData(cardSetsString) {
  try {
    return JSON.parse(cardSetsString);
  } catch (error) {
    logger.error(`Error parsing card sets data: ${error.message}`);
    throw new Error('Invalid card sets data format.');
  }
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
  logger.info(`CARDID: ${cardId}`);
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
async function createCardSetsAndVariants(cardInstance, cardData, cardModelName) {
  if (!cardData || !cardInstance || !cardModelName) {
    throw new Error('Invalid input for creating sets and variants.');
  }
  try {
    const cardSetIds = await createCardSets(cardData?.card_sets, cardModelName, cardInstance._id);
    logger.info(`SETIDS TYPE: ${typeof cardSetIds}`);
    logger.info(`Created ${cardSetIds.length} sets for card ${cardInstance._id}`);

    cardInstance.card_sets = cardSetIds;
    const cardVariantIds = await createCardVariants(cardSetIds, cardModelName, cardInstance._id); // This might need adjustment based on your data structure.
    logger.info(`Created ${cardVariantIds.length} variants for card ${cardInstance._id}`);

    cardInstance.cardVariants = cardVariantIds;
  } catch (error) {
    logger.error(`Error in createCardSetsAndVariants: ${error.message}`);
    throw error;
  }
}
function setAltArtDetails(card) {
  const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
  if (altArtImage) {
    card.variant.alt_art_image_url = altArtImage.image_url;
  }
  card.alt_art_ids = card.card_images.filter((img) => img.id !== card.id).map((img) => img.id);
}
function mapCardDataToModelFields(cardData, collectionId, collectionModel, cardModelName) {
  if (!cardData || !collectionId || !collectionModel || !cardModelName) {
    throw new Error('Invalid input for mapping card data.');
  }

  const contextualFields = {}; // Define or extract these as needed
  return constructCardDataObject(cardData, {
    collectionId,
    collectionModel,
    cardModelName,
    contextualFields,
  });
}
async function createAndSaveCard(cardData, additionalData) {
  if (!cardData || !additionalData) {
    throw new Error('Missing required parameters for creating a card in context.');
  }
  try {
    const { collectionId, collectionModel, cardModelName, tag, collectionData } = additionalData;
    logger.info(`Creating ${cardModelName} ${cardData.name} ...`);
    const mappedData = mapCardDataToModelFields(
      cardData,
      collectionId,
      collectionModel,
      cardModelName,
    );
    const Model = mongoose.model(cardModelName);
    const cardInstance = new Model(mappedData);
    // await cardInstance.save();
    await createCardSetsAndVariants(cardInstance, cardData, cardModelName);
    setAltArtDetails(cardInstance);
    cardInstance.variant =
      cardInstance.cardVariants.length > 0 ? cardInstance.cardVariants[0] : null;
    await cardInstance.populate('variant');
    cardInstance.rarity = cardInstance.variant?.rarity;
    await saveModel(Model, cardInstance);
    if (!collectionData) {
      return cardInstance;
    } else {
      const CollectionModel = mongoose.model(collectionModel);
      const collectionInstance = new CollectionModel(collectionData);
      if (collectionModel === 'Cart') {
        collectionInstance.items.push(cardInstance._id);
      } else {
        collectionInstance.cards.push(cardInstance._id);
      }
      await saveModel(CollectionModel, collectionInstance);
      return { cardInstance, collectionInstance };
    }
  } catch (error) {
    logger.error(`Error creating in createandsavecard: ${error.message}`);
    throw new Error(error);
  }
}

module.exports = {
  // USER ROUTES
  registerUser,
  // CARD MODELS
  createAndSaveCard,
  createCardSetsAndVariants,
  setAltArtDetails,
  mapCardDataToModelFields,
  // CARD ROUTES
  // addOrUpdateCards,
  // removeCards,
};
