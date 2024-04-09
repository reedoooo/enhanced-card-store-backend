const { constructCardDataObject } = require('../../utils/utils');
const { CardSet, CardVariant } = require('../../models');
const { default: mongoose } = require('mongoose');
const { handleError } = require('../../middleware/errorHandling/errorHandler');

async function createCardSets(cardSetsData, cardModel, cardId) {
  if (!Array.isArray(cardSetsData)) {
    handleError('Invalid input: cardSetsData should be an array.', 400);
    return [];
  }

  return Promise.all(
    cardSetsData.map(async (set) => {
      const setPrice = mongoose.Types.Decimal128.fromString(set.set_price.replace(/^\$/, ''));

      const cardSet = new CardSet({
        ...set,
        set_price: setPrice,
        cardModel,
        cardId,
      });

      await cardSet.save();
      return cardSet._id;
    }),
  );
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
async function createSetsAndVariantsForCard(cardInstance, cardData, cardModel) {
  if (!cardData || !cardInstance || !cardModel) {
    throw new Error('Invalid input for creating sets and variants.');
  }

  const cardSetIds = await createCardSets(cardData.card_sets, cardModel, cardInstance._id);
  cardInstance.card_sets = cardSetIds;

  const cardVariantIds = await createCardVariants(cardSetIds, cardModel, cardInstance._id);
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
async function createAndSaveCardInContext(cardData, collectionId, cardModel, collectionModel) {
  if (!cardData || !collectionId || !cardModel || !collectionModel) {
    throw new Error('Missing required parameters for creating a card in context.');
  }

  const CardModel = mongoose.model(cardModel);
  const cardInstance = new CardModel(
    mapCardDataToModelFields(cardData, collectionId, collectionModel, cardModel),
  );

  await createSetsAndVariantsForCard(cardInstance, cardData, cardModel);
  setAltArtDetails(cardInstance);
  cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);
  await cardInstance.populate('variant');
  cardInstance.rarity = cardInstance.variant?.rarity;

  await cardInstance.save();
  return cardInstance;
}
const pushDefaultCardsToCollections = (collection, card) => {
  if (!collection || !card) {
    throw new Error('Both collection and card are required.');
  }

  // Dynamically handle card collection updates based on the model
  const refField = `${card.collectionModel.toLowerCase()}s`;
  collection[refField] = collection[refField] || [];
  collection[refField].push(card._id);
};
async function createAndSaveCard(cardData, collectionId, collectionModel, cardModel, tag) {
  // console.log(
  //   "CREATE ABD SAVE CARD",
  //   cardData,
  //   collectionId,
  //   collectionModel,
  //   cardModel,
  //   tag
  // );
  const additionalData = {
    collectionId,
    collectionModel,
    cardModel,
    tag,
    contextualFields: {},
  };
  const data = constructCardDataObject(cardData, additionalData);

  const CardModel = mongoose.model(cardModel);
  const cardInstance = new CardModel(data);

  // Depending on the collection model, push the collectionId to the correct refs
  const modelRefMapping = {
    Cart: 'cartRefs',
    Deck: 'deckRefs',
    Collection: 'collectionRefs',
  };
  const refField = modelRefMapping[collectionModel];
  if (refField) cardInstance[refField]?.push(collectionId);

  await createSetsAndVariantsForCard(cardInstance, data, cardModel);
  setAltArtDetails(cardInstance);
  cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);
  await cardInstance.populate('variant');
  cardInstance.rarity = cardInstance?.variant?.rarity;

  await cardInstance.save();
  return cardInstance;
}

module.exports = {
  createAndSaveCardInContext,
  createAndSaveCard,
  pushDefaultCardsToCollections,
  createSetsAndVariantsForCard,
  selectFirstVariant,
  setAltArtDetails,
  mapCardDataToModelFields,
  createCardSets,
  createCardVariants,
};
