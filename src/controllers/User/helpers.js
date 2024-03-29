const { default: mongoose } = require("mongoose");
const { cardController } = require("../Cards/CardController");
const {
  createAndSaveCardInContext,
  createAndSaveCard,
  pushDefaultCardsToCollections,
  createSetsAndVariantsForCard,
  selectFirstVariant,
  setAltArtDetails,
  mapCardDataToModelFields,
  createCardSets,
  createCardVariants,
} = require("./cardModelHelpers.jsx");
const { getCardInfo } = require("../../utils/utils");
const { default: axios } = require("axios");
const logger = require("../../configs/winston.js");
const {
  handleError,
} = require("../../middleware/errorHandling/errorHandler.js");
const { infoLogger } = require("../../middleware/loggers/logInfo.js");
const ERROR_MESSAGES = {
  defaultCardDataFetchFailed: (cardName) =>
    `Failed to fetch default card data for ${cardName}`,
  cardRequired: "Card is required in reFetchForSave",
  collectionIdRequired: "Collection ID is required in reFetchForSave",
  collectionModelRequired: "Collection model is required in reFetchForSave",
  cardModelRequired: "Card model is required in reFetchForSave",
};
// !--------------------------! USERS !--------------------------!
async function fetchAndTransformCardData(cardName, context) {
  const cardData = await cardController.fetchAndTransformCardData(cardName);
  if (!cardData || cardData.length === 0) {
    throw new Error(ERROR_MESSAGES.defaultCardDataFetchFailed(cardName));
  }
  infoLogger(`Default card fetched for ${context}: ${cardData[0].name}`, context);
  return cardData[0];
}

async function ensureCardModelExists(cardInfo, context) {
  const modelName = `CardIn${context}`;
  const CardModel = mongoose.model(modelName);
  let card = await CardModel.findOne({ name: cardInfo.name });

  if (!card) {
    card = new CardModel({
      ...cardInfo,
      id: cardInfo.id.toString(),
      quantity: 1,
    });
    await card.save();
    infoLogger(`Default card created for ${context}: ${card.name}`);
  } else {
    infoLogger(`Default card already exists for ${context}: ${card.name}`);
  }
  return card;
}
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
    const cardInfo = await fetchAndTransformCardData(defaultCardName, context);
    return await ensureCardModelExists(cardInfo, context);
  } catch (error) {
    handleError(error, `Error fetching the default card for ${context}`);
  }
}
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
  try {
    const collection = new Model({
      ...collectionData,
      userId,
      name: collectionData.name || collectionName,
    });
    infoLogger(`New ${collectionData.name}:`, collection);
    return collection;
  } catch (error) {
    handleError(error, `Error creating the default collection ${collectionName}`);
  }
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
    // Define collection types and names in an array
    const collectionTypes = [
      { type: Collection, name: "My First Collection" },
      { type: Deck, name: "My First Deck" },
      { type: Cart, name: "My First Cart" }
    ];

    // Function to create and log collections
    const createAndLogCollection = async ({ type, name }) => {
      const collection = await createAndSaveDefaultCollection(type, name, userId);
      console.log(`Created ${name}`);
      return collection;
    };

    // Map over collectionTypes to create all collections
    const collections = await Promise.all(
      collectionTypes.map(createAndLogCollection)
    );

    // Fetch card data once and reuse it for each collection
    const cardName = "dark magician";
    const defaultCardData = await cardController.fetchAndTransformCardData(cardName);
    if (!defaultCardData || defaultCardData.length === 0) {
      throw new Error(`Failed to fetch default card data for ${cardName}`);
    }
    console.log(`Fetched default card data: ${defaultCardData[0].name}`);

    // Function to create, save, and log CardInContext for each collection
    const createAndLogCardInContext = async (collection) => {
      const context = collection.name.replace("My First ", "");
      const cardInContext = await createAndSaveCardInContext(
        defaultCardData[0],
        collection._id,
        `CardIn${context}`,
        context
      );
      console.log(`Created default card for ${context}: ${cardInContext.name}`);
      return cardInContext;
    };

    // Create and save CardInContext for each collection, then push to collections
    const cardsInContext = await Promise.all(collections.map(createAndLogCardInContext));
    cardsInContext.forEach((card, index) => pushDefaultCardsToCollections(collections[index], card));

    // Save all updated collections
    await Promise.all(collections.map(collection => collection.save()));
    console.log("Saved all updated collections");

    // Destructure collections to return individually named objects
    const [defaultCollection, defaultDeck, defaultCart] = collections;
    return { defaultCollection, defaultDeck, defaultCart };
  } catch (error) {
    throw new Error(`Error creating default collections and cards: ${error.message}`);
  }
}

// async function createDefaultCollectionsAndCards(userId) {
//   try {
//     // Ensure that these calls return the saved Mongoose document
//     const defaultCollection = await createAndSaveDefaultCollection(
//       Collection,
//       "My First Collection",
//       userId
//     );
//     const defaultDeck = await createAndSaveDefaultCollection(
//       Deck,
//       "My First Deck",
//       userId
//     );
//     const defaultCart = await createAndSaveDefaultCollection(Cart, "", userId);

//     infoLogger(
//       "SECTION 2 COMPLETE: DEFAULT COLLECTION, DECK, CART",
//       defaultCart
//     );
//     const defaultCardData =
//       await cardController.fetchAndTransformCardData("dark magician");
//     if (!defaultCardData || defaultCardData.length === 0) {
//       throw new Error("Failed to fetch default card data", defaultCardData);
//     }
//     infoLogger("SECTION 3: DEFAULT CARD DATA", defaultCardData[0].name);
//     const cardInfo = defaultCardData[0]; // Assuming the first element has the necessary data
//     infoLogger(
//       "SECTION 3.05: COMPLETE: FETCH DEFAULT CARD DATA",
//       cardInfo.name
//     );

//     // Create and save CardInContext
//     const defaultCardForCollection = await createAndSaveCardInContext(
//       cardInfo,
//       defaultCollection._id,
//       "CardInCollection",
//       "Collection"
//     );
//     const defaultCardForDeck = await createAndSaveCardInContext(
//       cardInfo,
//       defaultDeck._id,
//       "CardInDeck",
//       "Deck"
//     );
//     const defaultCardForCart = await createAndSaveCardInContext(
//       cardInfo,
//       defaultCart._id,
//       "CardInCart",
//       "Cart"
//     );
//     infoLogger(
//       "SECTION 4 COMPLETE: DEFAULT CARD FOR COLLECTION, DECK, CART",
//       "collection",
//       defaultCardForCollection.name,
//       "deck",
//       defaultCardForDeck.name,
//       "cart",
//       defaultCardForCart.name
//     );
//     // Push default cards to their respective collections
//     // await Promise.all([defaultCollection.save(), defaultDeck.save(), defaultCart.save()]);
//     infoLogger("SECTION 5 COMPLETE: SAVE ALL DOCUMENTS");

//     // Add default cards to their respective collections
//     pushDefaultCardsToCollections(defaultCollection, defaultCardForCollection);
//     pushDefaultCardsToCollections(defaultDeck, defaultCardForDeck);
//     pushDefaultCardsToCollections(defaultCart, defaultCardForCart);
//     infoLogger("SECTION 5.5 COMPLETE: PUSH DEFAULT CARDS TO COLLECTION");

//     // Save the updated collections
//     await Promise.all([
//       defaultCollection.save(),
//       defaultDeck.save(),
//       defaultCart.save(),
//     ]);
//     infoLogger("SECTION 6 COMPLETE: SAVE UPDATED CONTEXTS");

//     return { defaultCollection, defaultDeck, defaultCart };
//   } catch (error) {
//     throw new Error(
//       `Failed in SECTION: Error creating default collections and cards: ${error.message}`
//     );
//   }
// }
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
    // infoLogger('CARD DATA AFTER REFETCH: ', response);
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
      infoLogger(
        "[SECTION X-0] COMPLETE: CREATE DEFAULT COLLECTIONS AND CARDS"
      );
      return newCollection; // Return the new collection
    } else {
      const { defaultCollection, defaultDeck, defaultCart } =
        await createDefaultCollectionsAndCards(user._id);
      infoLogger(
        "[SECTION X-0] COMPLETE: CREATE DEFAULT COLLECTIONS AND CARDS"
      );
      user.allCollections.push(defaultCollection._id);
      user.allDecks.push(defaultDeck._id);
      user.cart = defaultCart._id;
      infoLogger(
        "[SECTION X-1] COMPLETE: PUSH DEFAULT COLLECTIONS AND CARDS TO USER"
      );

      await user.save();
      infoLogger("[SECTION X-2] COMPLETE: SAVE USER");
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
    // infoLogger('SECTION X-3: FETCH USER IDS');
    const users = await User.find({}).select("_id"); // This query retrieves all users but only their _id field
    const allUserIds = [];
    const userIds = users.map((user) => user._id); // Extract the _id field from each user document
    allUserIds.push(...userIds);

    infoLogger("SECTION X-4: COMPLETE".yellow);

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
  createAndSaveCardInContext,
  selectFirstVariant,
  setupDefaultCollectionsAndCards,
  fetchUserIdsFromUserSecurityData,
  reFetchForSave,
};
// async function getDefaultCardForContext(context) {
//   const defaultCardName = "Blue-Eyes White Dragon";
//   try {
//     const defaultCardData =
//       await cardController.fetchAndTransformCardData(defaultCardName);
//     if (!defaultCardData || defaultCardData.length === 0) {
//       throw new Error(
//         ERROR_MESSAGES.defaultCardDataFetchFailed(defaultCardName)
//       );
//     }

//     const cardInfo = defaultCardData[0];
//     const modelName = `CardIn${context}`;
//     const CardModel = mongoose.model(modelName);
//     let card = await CardModel.findOne({ name: cardInfo.name });

//     if (!card) {
//       card = new CardModel({
//         ...cardInfo,
//         id: cardInfo.id.toString(),
//         name: cardInfo.name,
//         quantity: 1,
//       });
//       await card.save();
//       infoLogger(`Default card created for ${context}: ${card.name}`);
//     } else {
//       infoLogger(`Default card already exists for ${context}: ${card.name}`);
//     }

//     return card;
//   } catch (error) {
//     console.error(`Error fetching the default card for ${context}:`, error);
//     throw error;
//   }
// }
