const { default: mongoose } = require("mongoose");
const { cardController } = require("../Cards/CardController");
const { validateCardData } = require("../../middleware/validation/validators");
const { default: axios } = require("axios");
const { validationResult } = require("express-validator");
const { constructCardDataObject, getCardInfo } = require("../../utils/utils");
const { CardSet, CardVariant } = require("../../models");
function setCollectionRefs(instance, collectionId, collectionModel) {
  const modelRefMapping = {
    Cart: "cartRefs",
    Deck: "deckRefs",
    Collection: "collectionRefs",
  };
  const refField = modelRefMapping[collectionModel];
  if (refField) {
    instance[refField].push(collectionId);
  }
}

// !--------------------------! USERS !--------------------------!
/**
 * [] Helper functions for different methods
 * Function to get the default card for a context
 * @param {*} context
 * @returns {CardInContext} A CardInContext instance
 * @throws {Error} If the card doesn't exist
 */
async function getDefaultCardForContext(context) {
  try {
    const defaultCardName = "Blue-Eyes White Dragon";
    const defaultCardData =
      await cardController.fetchAndTransformCardData(defaultCardName);
    if (!defaultCardData || defaultCardData.length === 0) {
      throw new Error(
        `Failed to fetch default card data for ${defaultCardName}`
      );
    }

    const cardInfo = defaultCardData[0];
    const modelName = `CardIn${context}`;
    const CardModel = mongoose.model(modelName);
    let card = await CardModel.findOne({ name: cardInfo.name });

    if (!card) {
      card = new CardModel({
        ...cardInfo,
        id: cardInfo.id.toString(),
        name: cardInfo.name,
        quantity: 1,
      });
      await card.save();

      console.log(`Default card created for ${context}: ${card.name}`);
    } else {
      console.log(`Default card already exists for ${context}: ${card.name}`);
    }

    return card;
  } catch (error) {
    console.error(`Error fetching the default card for ${context}:`, error);
    throw error;
  }
}
/**
 * [SECTION 5] Helper functions for different methods
 * Helper function to create a card data object.
 * @param {Object} card - The card object.
 * @param {Object} existingCardData - The existing card data object.
 * @returns {Object} - A card data object.
 * @throws {Error} If the card data is invalid
 */
async function createCardSets(cardSetsData, cardModel, cardId) {
  if (!Array.isArray(cardSetsData)) {
    console.error('Expected an array, received:', cardSetsData);
    // Handle error appropriately, maybe return an empty array or a default value
    return [];
  }
  if (cardSetsData && cardModel && cardId) {
    console.log("SECTION 5: CREATE CARD SETS", cardSetsData[0].set_name);
  }
  return Promise.all(
    cardSetsData?.map(async (set) => {
      let setPrice;

      // Check if the set_price contains a dollar sign
      if (set.set_price.startsWith("$")) {
        // Remove dollar sign and convert to Decimal128
        setPrice = mongoose.Types.Decimal128.fromString(
          set.set_price.replace("$", "")
        );
      } else {
        // Convert to Decimal128 directly
        setPrice = mongoose.Types.Decimal128.fromString(set.set_price);
      }

      const cardSet = new CardSet({
        ...set,
        set_price: setPrice, // Use the converted price
        cardModel: cardModel,
        cardId: cardId,
      });
      await cardSet.save();
      return cardSet._id;
    })
  );
}
/**
 * [SECTION 6] Helper functions for different methods
 * Helper function to create a card data object.
 * @param {Object} card - The card object.
 * @param {Object} existingCardData - The existing card data object.
 * @returns {Object} - A card data object.
 * @throws {Error} If the card data is invalid
 */
async function createCardVariants(sets, cardModel, cardId) {
  return Promise.all(
    sets.map(async (setId, index) => {
      // Assuming 'sets' array contains objects with the required fields
      const set = await CardSet.findById(setId);

      if (!set) {
        throw new Error(`CardSet with ID ${setId} not found`);
      }

      const cardVariant = new CardVariant({
        set_name: set.set_name,
        set_code: set.set_code,
        rarity: set.set_rarity,
        rarity_code: set.set_rarity_code,
        price: set.set_price,
        selected: false, // Default value
        alt_art_image_url: "", // Default value, update if necessary
        set: setId, // Reference to the CardSet's ObjectId
        cardModel: cardModel,
        cardId: cardId,
        variant: index + 1, // Assuming the index is 0-based
      });

      await cardVariant.save();
      return cardVariant._id;
    })
  );
}
/**
 * [SECTION 7] Helper functions for different methods
 * Helper function to create a card data object.
 * @param {Object} card - The card object.
 * @param {Object} existingCardData - The existing card data object.
 * @returns {Object} - A card data object.
 * @throws {Error} If the card data is invalid
 */
async function createSetsAndVariantsForCard(cardInstance, cardData, cardModel) {
  if (cardData && cardInstance && cardModel) {
    console.log("SECTION 6: CREATE CARD SETS AND VARIANTS", cardData.name);
  }
  const cardSetIds = await createCardSets(
    cardData?.card_sets,
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
/**
 * [SECTION 8] Helper functions for different methods
 * Helper function to create a card data object.
 * @param {Object} card - The card object.
 * @param {Object} existingCardData - The existing card data object.
 * @returns {Object} - A card data object.
 * @throws {Error} If the card data is invalid
 */
function selectFirstVariant(cardVariants) {
  return cardVariants.length > 0 ? cardVariants[0] : null;
}
/**
 * [SECTION 9] Helper functions for different methods
 * Set alt_art_image_url
 * @param {Object} card - Card object
 * @constant {Object} card.card_images - Card images array
 * @constant {String} card.id - Card ID
 * @constant {String} card.variant.alt_art_image_url - Card variant alt art image URL
 * @constant {Array} card.alt_art_ids - Card alt art IDs
 * @returns {void}
 */
function setAltArtDetails(card) {
  const altArtImage = card.card_images.find((img) => img.id === card.id + 1);
  if (altArtImage) card.variant.alt_art_image_url = altArtImage.image_url;
  card.alt_art_ids = card.card_images
    .filter((img) => img.id !== card.id)
    .map((img) => img.id);
}
/**
 * [SECTION 4] Helper functions for different methods
 * Function to map card data to model fields
 * @param {*} cardData
 * @param {*} collectionId
 * @param {*} collectionModel
 * @returns {Object} An object containing the mapped fields
 * @throws {Error} If the card doesn't exist
 */
function mapCardDataToModelFields(
  cardData,
  collectionId,
  collectionModel,
  cardModel
) {
  // Assuming 'tag' or other specific fields might be determined within this function or passed in some other way.
  const tag = ""; // Define how 'tag' should be determined or passed to this function.

  // Additional contextual fields or adjustments specific to this mapping might go here.
  // For example, if certain fields need to be handled differently than in the general constructCardDataObject utility.
  const additionalContextualFields = {
    // Any additional fields or overrides for this specific use case.
    // Example: type: cardData.type,
  };

  // Use the general card data construction utility, passing in the card data and additional details.
  const mappedData = constructCardDataObject(cardData, {
    collectionId,
    collectionModel,
    cardModel,
    tag,
    contextualFields: additionalContextualFields,
  });

  // Return the fully mapped and constructed card data object.
  return mappedData;
}

/**
 * [SECTION 3] Helper functions for different methods
 * Function to create and save a CardInContext
 * @param {*} cardInfo
 * @param {*} collectionId
 * @param {*} cardModel
 * @param {*} collectionModel
 * @returns {CardInContext} A CardInContext instance
 */
async function createAndSaveCardInContext(
  cardData,
  collectionId,
  cardModel,
  collectionModel
) {
  if (!cardData) {
    throw new Error("Card data is required");
  }
  if (!collectionId) {
    throw new Error("Collection ID is required");
  }
  if (!cardModel) {
    throw new Error("Card model is required");
  }
  if (!collectionModel) {
    throw new Error("Collection model is required");
  }

  const CardModel = mongoose.model(cardModel);

  // Check if the cardData tag is 'random'
  let cardInstance;
  if (cardData.tag === "random") {
    // Create a new card instance without mapping
    console.log("SECTION 6.5a: CREATE CARD IN CONTEXT", cardData.name);
    cardInstance = new CardModel({
      collectionId: collectionId,
      collectionModel: collectionModel,
      ...cardData, // Use other cardData properties as needed
    });
  } else {
    // Use mapCardDataToModelFields for other cases
    cardInstance = new CardModel(
      mapCardDataToModelFields(
        cardData,
        collectionId,
        collectionModel,
        cardModel
      )
    );
  }

  if (!cardInstance) {
    throw new Error("Failed to create card in context");
  }
  console.log(
    "SECTION 6.5c COMPLETE: CREATE CARD IN CONTEXT",
    cardInstance.name
  );
  // Create card sets and variants
  await createSetsAndVariantsForCard(cardInstance, cardData, cardModel);
  console.log("SECTION 7 COMPLETE: CREATE CARD SETS AND VARIANTS");

  // Set the alt art details and select the first variant
  setAltArtDetails(cardInstance);

  cardInstance.variant = selectFirstVariant(cardInstance.cardVariants);
  if (!cardInstance.variant) {
    throw new Error("No variant found for the card");
  }

  await cardInstance.populate("variant");
  cardInstance.rarity = cardInstance?.variant?.rarity;

  await cardInstance.save();
  return cardInstance;
}
/**
 * [SECTION 8] Helper functions for different methods
 * Function to push a card to a collection
 * @param {Object} collection - The collection object.
 * @param {Object} card - The card object.
 * @returns {void}
 */
const pushDefaultCardsToCollections = (collection, card) => {
  // Check if collection and card are valid objects
  if (!collection || !card) {
    throw new Error("Collection and card are required", collection, card);
  }
  // Handle different collection types
  switch (card.collectionModel) {
    case "Cart":
      collection.cart = collection.cart || [];
      collection.cart.push(card._id);
      break;
    case "Deck":
    case "Collection":
    case "SearchHistory":
      collection.cards = collection.cards || [];
      collection.cards.push(card._id);
      break;
    default:
      console.error(`Unknown collection type: ${card.collectionModel}`);
      throw new Error(`Unknown collection type: ${card.collectionModel}`);
  }
};
/**
 * [SECTION 2] Helper functions for different methods
 * Function to create and save a default collection
 * @param {*} Model
 * @param {*} collectionName
 * @param {*} userId
 * @returns {Collection} A Collection instance
 */
async function createAndSaveDefaultCollection(
  Model,
  collectionName,
  userId,
  collectionData = {}
) {
  const collection = new Model({ userId, name: collectionName });
  if (!collection) {
    throw new Error("Failed to create default collection", collection);
  }
  if (collectionData.name) {
    collection.name = collectionData.name;
    collection.description = collectionData.description;
  }
  await collection.save();
  return collection;
}
/**
 * [SECTION 1] Helper functions for different methods
 * Function to create default collections and cards for a new user
 * @param {*} userId
 * @returns {Object} An object containing the default collections and cards
 * @throws {Error} If the card doesn't exist
 */
async function createDefaultCollectionsAndCards(userId) {
  try {
    // Ensure that these calls return the saved Mongoose document
    const defaultCollection = await createAndSaveDefaultCollection(
      Collection,
      "My First Collection",
      userId
    );
    const defaultDeck = await createAndSaveDefaultCollection(
      Deck,
      "My First Deck",
      userId
    );
    const defaultCart = await createAndSaveDefaultCollection(Cart, "", userId);

    console.log(
      "SECTION 2 COMPLETE: DEFAULT COLLECTION, DECK, CART",
      // defaultCollection,
      // defaultDeck,
      defaultCart
    );
    // Create a default card to initialize the default collections with a card
    const defaultCardData =
      await cardController.fetchAndTransformCardData("dark magician");
    if (!defaultCardData || defaultCardData.length === 0) {
      throw new Error("Failed to fetch default card data", defaultCardData);
    }
    console.log("SECTION 3: DEFAULT CARD DATA", defaultCardData[0].name);
    const cardInfo = defaultCardData[0]; // Assuming the first element has the necessary data
    console.log(
      "SECTION 3.05: COMPLETE: FETCH DEFAULT CARD DATA",
      cardInfo.name
    );

    // Create and save CardInContext
    const defaultCardForCollection = await createAndSaveCardInContext(
      cardInfo,
      defaultCollection._id,
      "CardInCollection",
      "Collection"
    );
    const defaultCardForDeck = await createAndSaveCardInContext(
      cardInfo,
      defaultDeck._id,
      "CardInDeck",
      "Deck"
    );
    const defaultCardForCart = await createAndSaveCardInContext(
      cardInfo,
      defaultCart._id,
      "CardInCart",
      "Cart"
    );
    console.log(
      "SECTION 4 COMPLETE: DEFAULT CARD FOR COLLECTION, DECK, CART",
      "collection",
      defaultCardForCollection.name,
      "deck",
      defaultCardForDeck.name,
      "cart",
      defaultCardForCart.name
    );
    // Push default cards to their respective collections
    // await Promise.all([defaultCollection.save(), defaultDeck.save(), defaultCart.save()]);
    console.log("SECTION 5 COMPLETE: SAVE ALL DOCUMENTS");

    // Add default cards to their respective collections
    pushDefaultCardsToCollections(defaultCollection, defaultCardForCollection);
    pushDefaultCardsToCollections(defaultDeck, defaultCardForDeck);
    pushDefaultCardsToCollections(defaultCart, defaultCardForCart);
    console.log("SECTION 5.5 COMPLETE: PUSH DEFAULT CARDS TO COLLECTION");

    // Save the updated collections
    await Promise.all([
      defaultCollection.save(),
      defaultDeck.save(),
      defaultCart.save(),
    ]);
    console.log("SECTION 6 COMPLETE: SAVE UPDATED CONTEXTS");

    return { defaultCollection, defaultDeck, defaultCart };
  } catch (error) {
    throw new Error(
      `Failed in SECTION: Error creating default collections and cards: ${error.message}`
    );
  }
}
// Common function to handle card data creation and saving
async function createAndSaveCard(
  cardData,
  collectionId,
  collectionModel,
  cardModel,
  tag
) {
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

/**
 * [SECTION 10] Helper functions for different methods
 * Function to re-fetch card data and save it
 * @param {*} card
 * @param {*} collectionId
 * @param {*} collectionModel
 * @param {*} cardModel
 * @returns {CardInContext} A CardInContext instance
 * @throws {Error} If the card doesn't exist
 * @throws {Error} If the collection ID is invalid
 * @throws {Error} If the collection model is invalid
 * @throws {Error} If the card model is invalid
 * @throws {Error} If the card data is invalid
 * */
async function reFetchForSave(card, collectionId, collectionModel, cardModel) {
  try {
    if (!card) {
      throw new Error("Card is required in reFetchForSave");
    }
    if (!collectionId) {
      throw new Error("Collection ID is required in reFetchForSave");
    }
    if (!collectionModel) {
      throw new Error("Collection model is required in reFetchForSave");
    }
    if (!cardModel) {
      throw new Error("Card model is required in reFetchForSave");
    }
    const response = await getCardInfo(card?.name);
    // const cardData = response;
    // console.log('CARD DATA AFTER REFETCH: ', response);
    return await createAndSaveCard(
      response,
      collectionId,
      collectionModel,
      cardModel,
      "refetch"
    );
  } catch (error) {
    console.error(`Failed to re-fetch card Name ${card.name}:`, error);
    return null;
  }
}
/**
 * [SECTION 0] Helper functions for different methods
 * @param {*} cardName
 * @returns {Object} A random card from the YGOPRODeck API
 */
async function fetchAndSaveRandomCard(
  collectionId,
  collectionModel,
  cardModel
) {
  try {
    const axiosInstance = axios.create({
      baseURL: "https://db.ygoprodeck.com/api/v7/",
    });

    const endpoint = "randomcard.php";
    const response = await axiosInstance.get(endpoint);
    const cardData = response.data;

    const additionalData = {
      collectionId,
      collectionModel,
      cardModel,
      tag: "random",
      contextualFields: {
        // Add any random card-specific fields here
        // Example:
        // type: cardData.type,
      },
    };
    return await createAndSaveCard(
      cardData,
      collectionId,
      collectionModel,
      cardModel,
      "random"
    );
  } catch (error) {
    console.error("Failed to fetch random card:", error);
    return null;
  }
}
/**
 * [SECTION 0] Helper functions for different methods
 * Function to create default collections and cards for a new user
 * @param {*} newUser
 * @returns {void}
 */
const setupDefaultCollectionsAndCards = async (
  user,
  collectionModel,
  collectionData
) => {
  try {
    let newCollection;
    if (collectionModel) {
      newCollection = await createAndSaveDefaultCollection(
        mongoose.model(collectionModel),
        `${collectionModel} Name`,
        user._id,
        collectionData
      );

      let randomCardData = await fetchAndSaveRandomCard(
        newCollection._id,
        collectionModel,
        `CardIn${collectionModel}`
      );
      if (!randomCardData) {
        throw new Error("Failed to fetch random card data");
      }

      newCollection.cards.push(randomCardData._id);
      await newCollection.save();
      console.log(
        "[SECTION X-0] COMPLETE: CREATE DEFAULT COLLECTIONS AND CARDS"
      );
      return newCollection; // Return the new collection
    } else {
      const { defaultCollection, defaultDeck, defaultCart } =
        await createDefaultCollectionsAndCards(user._id);
      console.log(
        "[SECTION X-0] COMPLETE: CREATE DEFAULT COLLECTIONS AND CARDS"
      );
      user.allCollections.push(defaultCollection._id);
      user.allDecks.push(defaultDeck._id);
      user.cart = defaultCart._id;
      console.log(
        "[SECTION X-1] COMPLETE: PUSH DEFAULT COLLECTIONS AND CARDS TO USER"
      );

      await user.save();
      console.log("[SECTION X-2] COMPLETE: SAVE USER");
    }
  } catch (error) {
    console.error("Error setting up default collections and cards:", error);
    throw error;
  }
};
/**
 * [SECTION 0] Helper functions for different methods
 * Function to create default collections and cards for a new user
 * @param {*} newUser
 * @returns {void}
 */
async function fetchUserIdsFromUserSecurityData() {
  try {
    // console.log('SECTION X-3: FETCH USER IDS');
    const users = await User.find({}).select("_id"); // This query retrieves all users but only their _id field
    const allUserIds = [];
    const userIds = users.map((user) => user._id); // Extract the _id field from each user document
    allUserIds.push(...userIds);

    console.log("SECTION X-4: COMPLETE".yellow);

    return { userIdData: users, allUserIds };
  } catch (error) {
    console.error("Error fetching userIds:", error);
    throw error;
  }
}

module.exports = {
  createDefaultCollectionsAndCards,
  pushDefaultCardsToCollections,
  createAndSaveDefaultCollection,
  getDefaultCardForContext,
  createCardSets,
  createCardVariants,
  mapCardDataToModelFields,
  createAndSaveCardInContext,
  selectFirstVariant,
  setupDefaultCollectionsAndCards,
  fetchUserIdsFromUserSecurityData,
  fetchAndSaveRandomCard,
  reFetchForSave,
};
