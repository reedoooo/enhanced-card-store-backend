// // const { validateCardData } = require("../../middleware/validation/validators");
// /**
//  * [SECTION 5] Helper functions for different methods
//  * Helper function to create a card data object.
//  * @param {Object} card - The card object.
//  * @param {Object} existingCardData - The existing card data object.
//  * @returns {Object} - A card data object.
//  * @throws {Error} If the card data is invalid
//  */
// async function createCardSets(cardSetsData, cardModel, cardId) {
//   if (!Array.isArray(cardSetsData)) {
//     console.error("Expected an array, received:", cardSetsData);
//     // Handle error appropriately, maybe return an empty array or a default value
//     return [];
//   }
//   if (cardSetsData && cardModel && cardId) {
//     console.log("SECTION 5: CREATE CARD SETS", cardSetsData[0].set_name);
//   }
//   return Promise.all(
//     cardSetsData?.map(async (set) => {
//       let setPrice;

//       // Check if the set_price contains a dollar sign
//       if (set.set_price.startsWith("$")) {
//         // Remove dollar sign and convert to Decimal128
//         setPrice = mongoose.Types.Decimal128.fromString(
//           set.set_price.replace("$", "")
//         );
//       } else {
//         // Convert to Decimal128 directly
//         setPrice = mongoose.Types.Decimal128.fromString(set.set_price);
//       }

//       const cardSet = new CardSet({
//         ...set,
//         set_price: setPrice, // Use the converted price
//         cardModel: cardModel,
//         cardId: cardId,
//       });
//       await cardSet.save();
//       return cardSet._id;
//     })
//   );
// }
// /**
//  * [SECTION 6] Helper functions for different methods
//  * Helper function to create a card data object.
//  * @param {Object} card - The card object.
//  * @param {Object} existingCardData - The existing card data object.
//  * @returns {Object} - A card data object.
//  * @throws {Error} If the card data is invalid
//  */
// async function createCardVariants(sets, cardModel, cardId) {
//   return Promise.all(
//     sets.map(async (setId, index) => {
//       // Assuming 'sets' array contains objects with the required fields
//       const set = await CardSet.findById(setId);

//       if (!set) {
//         throw new Error(`CardSet with ID ${setId} not found`);
//       }

//       const cardVariant = new CardVariant({
//         set_name: set.set_name,
//         set_code: set.set_code,
//         rarity: set.set_rarity,
//         rarity_code: set.set_rarity_code,
//         price: set.set_price,
//         selected: false, // Default value
//         alt_art_image_url: "", // Default value, update if necessary
//         set: setId, // Reference to the CardSet's ObjectId
//         cardModel: cardModel,
//         cardId: cardId,
//         variant: index + 1, // Assuming the index is 0-based
//       });

//       await cardVariant.save();
//       return cardVariant._id;
//     })
//   );
// }
// /**
//  * [SECTION 7] Helper functions for different methods
//  * Helper function to create a card data object.
//  * @param {Object} card - The card object.
//  * @param {Object} existingCardData - The existing card data object.
//  * @returns {Object} - A card data object.
//  * @throws {Error} If the card data is invalid
//  */
// async function createSetsAndVariantsForCard(cardInstance, cardData, cardModel) {
//   if (cardData && cardInstance && cardModel) {
//     console.log("SECTION 6: CREATE CARD SETS AND VARIANTS", cardData.name);
//   }
//   const cardSetIds = await createCardSets(
//     cardData?.card_sets,
//     cardModel,
//     cardInstance._id
//   );
//   cardInstance.card_sets = cardSetIds;

//   const cardVariantIds = await createCardVariants(
//     cardSetIds,
//     cardModel,
//     cardInstance._id
//   );
//   cardInstance.cardVariants = cardVariantIds;
// }
// /**
//  * [SECTION 8] Helper functions for different methods
//  * Helper function to create a card data object.
//  * @param {Object} card - The card object.
//  * @param {Object} existingCardData - The existing card data object.
//  * @returns {Object} - A card data object.
//  * @throws {Error} If the card data is invalid
//  */
// function selectFirstVariant(cardVariants) {
//   return cardVariants.length > 0 ? cardVariants[0] : null;
// }
// /**
//  * [SECTION 9] Helper functions for different methods
//  * Set alt_art_image_url
//  * @param {Object} card - Card object
//  * @constant {Object} card.card_images - Card images array
//  * @constant {String} card.id - Card ID
//  * @constant {String} card.variant.alt_art_image_url - Card variant alt art image URL
//  * @constant {Array} card.alt_art_ids - Card alt art IDs
//  * @returns {void}
//  */
// function setAltArtDetails(card) {
//   const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
//   if (altArtImage) card.variant.alt_art_image_url = altArtImage.image_url;
//   card.alt_art_ids = card.card_images
//     .filter((img) => img.id !== card.id)
//     .map((img) => img.id);
// }
// /**
//  * [SECTION 4] Helper functions for different methods
//  * Function to map card data to model fields
//  * @param {*} cardData
//  * @param {*} collectionId
//  * @param {*} collectionModel
//  * @returns {Object} An object containing the mapped fields
//  * @throws {Error} If the card doesn't exist
//  */
// function mapCardDataToModelFields(
//   cardData,
//   collectionId,
//   collectionModel,
//   cardModel
// ) {
//   const tag = ""; // Define how 'tag' should be determined or passed to this function.
//   const additionalContextualFields = {};
//   const mappedData = constructCardDataObject(cardData, {
//     collectionId,
//     collectionModel,
//     cardModel,
//     tag,
//     contextualFields: additionalContextualFields,
//   });

//   // Return the fully mapped and constructed card data object.
//   return mappedData;
// }
// /**
//  * [SECTION 3] Helper functions for different methods
//  * Function to create and save a CardInContext
//  * @param {*} cardInfo
//  * @param {*} collectionId
//  * @param {*} cardModel
//  * @param {*} collectionModel
//  * @returns {CardInContext} A CardInContext instance
//  */
// async function createAndSaveCardInContext(
//   cardData,
//   collectionId,
//   cardModel,
//   collectionModel
// ) {
//   if (!cardData) {
//     throw new Error("Card data is required");
//   }
//   if (!collectionId) {
//     throw new Error("Collection ID is required");
//   }
//   if (!cardModel) {
//     throw new Error("Card model is required");
//   }
//   if (!collectionModel) {
//     throw new Error("Collection model is required");
//   }

//   const CardModel = mongoose.model(cardModel);

//   // Check if the cardData tag is 'random'
//   let cardInstance;
//   if (cardData.tag === "random") {
//     // Create a new card instance without mapping
//     console.log("SECTION 6.5a: CREATE CARD IN CONTEXT", cardData.name);
//     cardInstance = new CardModel({
//       collectionId: collectionId,
//       collectionModel: collectionModel,
//       ...cardData, // Use other cardData properties as needed
//     });
//   } else {
//     // Use mapCardDataToModelFields for other cases
//     cardInstance = new CardModel(
//       mapCardDataToModelFields(
//         cardData,
//         collectionId,
//         collectionModel,
//         cardModel
//       )
//     );
//   }

//   if (!cardInstance) {
//     throw new Error("Failed to create card in context");
//   }
//   console.log(
//     "SECTION 6.5c COMPLETE: CREATE CARD IN CONTEXT",
//     cardInstance.name
//   );
//   // Create card sets and variants
//   await createSetsAndVariantsForCard(cardInstance, cardData, cardModel);
//   console.log("SECTION 7 COMPLETE: CREATE CARD SETS AND VARIANTS");

//   // Set the alt art details and select the first variant
//   setAltArtDetails(cardInstance);

//   cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);
//   if (!cardInstance.variant) {
//     throw new Error("No variant found for the card");
//   }

//   await cardInstance.populate("variant");
//   cardInstance.rarity = cardInstance?.variant?.rarity;

//   await cardInstance.save();
//   return cardInstance;
// }

// async function createAndSaveCard(
//   cardData,
//   collectionId,
//   collectionModel,
//   cardModel,
//   tag
// ) {
//   const additionalData = {
//     collectionId,
//     collectionModel,
//     cardModel,
//     tag,
//     contextualFields: {},
//   };
//   const data = constructCardDataObject(cardData, additionalData);

//   const CardModel = mongoose.model(cardModel);
//   const cardInstance = new CardModel(data);

//   // Depending on the collection model, push the collectionId to the correct refs
//   const modelRefMapping = {
//     Cart: "cartRefs",
//     Deck: "deckRefs",
//     Collection: "collectionRefs",
//   };
//   const refField = modelRefMapping[collectionModel];
//   if (refField) cardInstance[refField]?.push(collectionId);

//   await createSetsAndVariantsForCard(cardInstance, data, cardModel);
//   setAltArtDetails(cardInstance);
//   cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);
//   await cardInstance.populate("variant");
//   cardInstance.rarity = cardInstance?.variant?.rarity;

//   await cardInstance.save();
//   return cardInstance;
// }
// /**
//  * [SECTION 8] Helper functions for different methods
//  * Function to push a card to a collection
//  * @param {Object} collection - The collection object.
//  * @param {Object} card - The card object.
//  * @returns {void}
//  */
// const pushDefaultCardsToCollections = (collection, card) => {
//   // Check if collection and card are valid objects
//   if (!collection || !card) {
//     throw new Error("Collection and card are required", collection, card);
//   }
//   // Handle different collection types
//   switch (card.collectionModel) {
//     case "Cart":
//       collection.cart = collection.cart || [];
//       collection.cart.push(card._id);
//       break;
//     case "Deck":
//     case "Collection":
//     case "SearchHistory":
//       collection.cards = collection.cards || [];
//       collection.cards.push(card._id);
//       break;
//     default:
//       console.error(`Unknown collection type: ${card.collectionModel}`);
//       throw new Error(`Unknown collection type: ${card.collectionModel}`);
//   }
// };

// module.exports = {
// 	createAndSaveCardInContext,
// 	createAndSaveCard,
// 	pushDefaultCardsToCollections,
// 	createSetsAndVariantsForCard,
//   selectFirstVariant,
//   setAltArtDetails,
//   mapCardDataToModelFields,
// 	createCardSets,
//   createCardVariants,
// };
const { default: axios } = require("axios");
const { validationResult } = require("express-validator");
const { constructCardDataObject } = require("../../utils/utils");
const { CardSet, CardVariant } = require("../../models");
const { default: mongoose } = require("mongoose");
const { cardController } = require("../Cards/CardController");
// Improved error handling, consistent async/await usage, and clearer function responsibilities

//  * [SECTION 6] Helper functions for different methods
//  * Helper function to create a card data object.
//  * @param {Object} card - The card object.
//  * @param {Object} existingCardData - The existing card data object.
//  * @returns {Object} - A card data object.
//  * @throws {Error} If the card data is invalid
//  */
// async function createCardVariants(sets, cardModel, cardId) {
//   return Promise.all(
//     sets.map(async (setId, index) => {
//       // Assuming 'sets' array contains objects with the required fields
//       const set = await CardSet.findById(setId);

//       if (!set) {
//         throw new Error(`CardSet with ID ${setId} not found`);
//       }

//       const cardVariant = new CardVariant({
//         set_name: set.set_name,
//         set_code: set.set_code,
//         rarity: set.set_rarity,
//         rarity_code: set.set_rarity_code,
//         price: set.set_price,
//         selected: false, // Default value
//         alt_art_image_url: "", // Default value, update if necessary
//         set: setId, // Reference to the CardSet's ObjectId
//         cardModel: cardModel,
//         cardId: cardId,
//         variant: index + 1, // Assuming the index is 0-based
//       });

//       await cardVariant.save();
//       return cardVariant._id;
//     })
//   );
// }
async function createCardSets(cardSetsData, cardModel, cardId) {
  if (!Array.isArray(cardSetsData)) {
    console.error("Invalid input: cardSetsData should be an array.");
    return [];
  }

  return Promise.all(
    cardSetsData.map(async (set) => {
      const setPrice = mongoose.Types.Decimal128.fromString(
        set.set_price.replace(/^\$/, "")
      );

      const cardSet = new CardSet({
        ...set,
        set_price: setPrice,
        cardModel,
        cardId,
      });

      await cardSet.save();
      return cardSet._id;
    })
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
        alt_art_image_url: "",
        set: setId,
        cardModel,
        cardId,
        variant: index + 1,
        price: set.set_price,
      });

      await cardVariant.save();
      return cardVariant._id;
    })
  );
}

async function createSetsAndVariantsForCard(cardInstance, cardData, cardModel) {
  if (!cardData || !cardInstance || !cardModel) {
    throw new Error("Invalid input for creating sets and variants.");
  }

  const cardSetIds = await createCardSets(
    cardData.card_sets,
    cardModel,
    cardInstance._id
  );
  cardInstance.card_sets = cardSetIds;

  const cardVariantIds = await createCardVariants(
    cardSetIds,
    cardModel,
    cardInstance._id
  );
  cardInstance.cardVariants = cardVariantIds;
}

function selectFirstVariant(cardVariants) {
  return cardVariants.length > 0 ? cardVariants[0] : null;
}

function setAltArtDetails(card) {
  if (!card || !card.card_images || !card.id) {
    throw new Error("Invalid card data for setting alt art details.");
  }

  const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
  if (altArtImage) {
    card.variant.alt_art_image_url = altArtImage.image_url;
  }

  card.alt_art_ids = card.card_images
    .filter((img) => img.id !== card.id)
    .map((img) => img.id);
}

function mapCardDataToModelFields(
  cardData,
  collectionId,
  collectionModel,
  cardModel
) {
  if (!cardData || !collectionId || !collectionModel || !cardModel) {
    throw new Error("Invalid input for mapping card data.");
  }

  const contextualFields = {}; // Define or extract these as needed
  return constructCardDataObject(cardData, {
    collectionId,
    collectionModel,
    cardModel,
    contextualFields,
  });
}

async function createAndSaveCardInContext(
  cardData,
  collectionId,
  cardModel,
  collectionModel
) {
  if (!cardData || !collectionId || !cardModel || !collectionModel) {
    throw new Error(
      "Missing required parameters for creating a card in context."
    );
  }

  const CardModel = mongoose.model(cardModel);
  const cardInstance = new CardModel(
    mapCardDataToModelFields(cardData, collectionId, collectionModel, cardModel)
  );

  await createSetsAndVariantsForCard(cardInstance, cardData, cardModel);
  setAltArtDetails(cardInstance);
  cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);
  await cardInstance.populate("variant");
  cardInstance.rarity = cardInstance.variant?.rarity;

  await cardInstance.save();
  return cardInstance;
}

const pushDefaultCardsToCollections = (collection, card) => {
  if (!collection || !card) {
    throw new Error("Both collection and card are required.");
  }

  // Dynamically handle card collection updates based on the model
  const refField = `${card.collectionModel.toLowerCase()}s`;
  collection[refField] = collection[refField] || [];
  collection[refField].push(card._id);
};
async function createAndSaveCard(
  cardData,
  collectionId,
  collectionModel,
  cardModel,
  tag
) {
  console.log(
    "CREATE ABD SAVE CARD",
    cardData,
    collectionId,
    collectionModel,
    cardModel,
    tag
  );
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
    Cart: "cartRefs",
    Deck: "deckRefs",
    Collection: "collectionRefs",
  };
  const refField = modelRefMapping[collectionModel];
  if (refField) cardInstance[refField]?.push(collectionId);

  await createSetsAndVariantsForCard(cardInstance, data, cardModel);
  setAltArtDetails(cardInstance);
  cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);
  await cardInstance.populate("variant");
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
