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
  cardInstance.card_sets = cardSetIds;
  const cardVariantIds = await createCardVariants(cardSetIds, cardModel, cardInstance._id); // This might need adjustment based on your data structure.
  cardInstance.cardVariants = cardVariantIds;
}
function setAltArtDetails(card) {
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
    throw new Error('Missing required parameters for creating a card in context.');
  }
  const { collectionId, collectionModel, cardModel, tag, collectionData } = additionalData;
  const mappedData = mapCardDataToModelFields(cardData, collectionId, collectionModel, cardModel);
  const CardModel = mongoose.model(cardModel);
  const cardInstance = new CardModel(mappedData);
  await createCardSetsAndVariants(cardInstance, cardData, cardModel);
  setAltArtDetails(cardInstance);
  cardInstance.variant = cardInstance.cardVariants.length > 0 ? cardInstance.cardVariants[0] : null;
  await cardInstance.populate('variant');
  cardInstance.rarity = cardInstance.variant?.rarity;
  await saveModel(CardModel, cardInstance);
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
