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

const ERROR_MESSAGES = {
  defaultCardDataFetchFailed: (cardName) =>
    `Failed to fetch default card data for ${cardName}`,
  cardRequired: "Card is required in reFetchForSave",
  collectionIdRequired: "Collection ID is required in reFetchForSave",
  collectionModelRequired: "Collection model is required in reFetchForSave",
  cardModelRequired: "Card model is required in reFetchForSave",
};
// !--------------------------! USERS !--------------------------!
/**
 * [] Helper functions for different methods
 * Function to get the default card for a context
 * @param {*} context
 * @returns {CardInContext} A CardInContext instance
 * @throws {Error} If the card doesn't exist
 */
async function getDefaultCardForContext(context) {
  const defaultCardName = "Blue-Eyes White Dragon";
  try {
    const defaultCardData =
      await cardController.fetchAndTransformCardData(defaultCardName);
    if (!defaultCardData || defaultCardData.length === 0) {
      throw new Error(
        ERROR_MESSAGES.defaultCardDataFetchFailed(defaultCardName)
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
    // await collection.save();
    return collection;
  } catch (error) {
    throw new Error("Failed to create default collection", error);
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
      defaultCart
    );
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
  createAndSaveCardInContext,
  selectFirstVariant,
  setupDefaultCollectionsAndCards,
  fetchUserIdsFromUserSecurityData,
  reFetchForSave,
};
