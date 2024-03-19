// !--------------------------! COLLECTIONS !--------------------------!
const { CardInCollection } = require("../../../../src/models/Card");
const { Collection } = require("../../../../src/models/Collection");
const { fetchCardPrices } = require("../../Cards/helpers");
const {
  populateUserDataByContext,
  deepPopulateCardFields,
} = require("../dataUtils");
const {
  setupDefaultCollectionsAndCards,
  reFetchForSave,
  fetchUserIdsFromUserSecurityData,
} = require("../helpers");
const logger = require("../../../configs/winston");
// Helper to fetch and return populated user collections.
async function fetchPopulatedUserCollections(userId) {
  const populatedUser = await populateUserDataByContext(userId, [
    "collections",
  ]);
  if (!populatedUser) {
    throw new Error(`User not found: ${userId}`);
  }
  return populatedUser;
}
// Helper to find and validate a user's collection.
function findUserCollection(populatedUser, collectionId) {
  const collection = populatedUser.allCollections.find(
    (coll) => coll._id.toString() === collectionId
  );
  if (!collection) {
    throw new Error("Collection not found");
  }
  return collection;
}
// Helper to respond with JSON data.
function sendJsonResponse(res, status, message, data) {
  res.status(status).json({ message, data });
}
// ! COLLECTION ROUTES (GET, CREATE, UPDATE, DELETE) !
/**
 * Returns all collections for a user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
exports.getAllCollectionsForUser = async (req, res, next) => {
  try {
    const populatedUser = await fetchPopulatedUserCollections(
      req.params.userId
    );
    sendJsonResponse(
      res,
      200,
      `Fetched collections for user ${req.params.userId}`,
      populatedUser.allCollections
    );
  } catch (error) {
    logger.error("Error fetching collections", { error });
    next(error);
  }
};
/**
 * Creates a new collection for a user.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
exports.createNewCollection = async (req, res, next) => {
  try {
    const populatedUser = await fetchPopulatedUserCollections(
      req.params.userId
    );
    const newCollection = await setupDefaultCollectionsAndCards(
      populatedUser,
      "Collection",
      req.body
    );
    populatedUser.allCollections.push(newCollection._id);
    await populatedUser.save();

    const populatedCollection = await Collection.findById(
      newCollection._id
    ).populate("cards");
    sendJsonResponse(
      res,
      201,
      "New collection created successfully",
      populatedCollection
    );
  } catch (error) {
    logger.error("Error in createNewCollection", error);
    next(error);
  }
};
/**
 * Updates a collection for a user and syncs the collection's cards with the database.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 * @todo Update this to use the new CardInCollection schema
 */
exports.updateExistingCollection = async (req, res, next) => {
  try {
    const populatedUser = await fetchPopulatedUserCollections(
      req.params.userId
    );
    const collection = findUserCollection(
      populatedUser,
      req.params.collectionId
    );
    Object.assign(collection, req.body.updatedCollectionData);
    await collection.save();

    sendJsonResponse(res, 200, "Collection updated successfully", collection);
  } catch (error) {
    logger.error("Error updating collection:", error);
    next(error);
  }
};
/**
 * Deletes a collection for a user and removes the collection from the user's collections.
 * Optionally, you might want to delete the collection from the Collection model as well.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @returns {Promise<Response>} A promise that resolves to a response object
 * @todo Update this to use the new CardInCollection schema
 * @todo Optionally, you might want to delete the collection from the Collection model as well.
 * @todo Update this to use the new CardInCollection schema
 */
exports.deleteExistingCollection = async (req, res, next) => {
  try {
    const populatedUser = await fetchPopulatedUserCollections(
      req.params.userId
    );
    populatedUser.allCollections = populatedUser.allCollections.filter(
      (c) => c._id.toString() !== req.params.collectionId
    );
    await populatedUser.save();

    await Collection.findByIdAndDelete(req.params.collectionId);
    sendJsonResponse(
      res,
      200,
      "Collection deleted successfully",
      req.params.collectionId
    );
  } catch (error) {
    logger.error("Error deleting collection:", error);
    next(error);
  }
};
// COLLECTION ROUTES: CARDS-IN-COLLECTION Routes (GET, CREATE, UPDATE, DELETE)
/**
 * STATUS:
 * [O] OPERATIONAL
 * Adds a new card to a collection or updates the data of an existing card and returns the updated data
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @todo Update this to use the new CardInCollection schema
 */
exports.addCardsToCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  let { cards } = req.body; // Assuming 'cards' can be an object or an array
  if (!Array.isArray(cards)) {
    cards = [cards]; // Convert the object to an array containing that object
  }

  logger.info("Processing cards:", cards);
  try {
    const populatedUser = await fetchPopulatedUserCollections(userId);
    const collection = findUserCollection(populatedUser, collectionId);
    for (const cardData of cards) {
      // if (processedCardIds.has(cardData.id)) {
      //   console.log("Skipping duplicate card:", cardData.id);
      //   continue; // Skip duplicate card IDs
      // }
      console.log("Processing card:".red, cardData.id);
      console.log(
        "IDS OF ALL CARDS IN COLLECTION:".red,
        collection.cards.map((c) => c.id)
      );
      let foundCard = collection?.cards?.find(
        (c) => c.id.toString() === cardData.id
      );
      // console.log("Card in collection: ".red, foundCard);
      if (foundCard) {
        let cardInCollection = await CardInCollection.findById(foundCard._id);
        // console.log("Card in collection: ".red, foundCard);

        if (cardInCollection) {
          console.log("Updating existing card:", cardInCollection.name.blue);
          console.log("START QUANTITY: ".red, cardInCollection.quantity);
          console.log("START TOTAL PRICE: ".red, cardInCollection.totalPrice);

          // Correctly increment the quantity and update total price
          cardInCollection.quantity += 1;
          cardInCollection.totalPrice =
            cardInCollection.quantity * cardInCollection.price;

          // Save the updated card document
          await cardInCollection.save();

          // Update collection's total quantity and price accordingly
          collection.totalQuantity += cardData.quantity;
          collection.totalPrice += cardData.quantity * cardInCollection.price;
        } else {
          console.log("Card not found in CardInCollection:", foundCard._id);
        }
      } else {
        if (!cardData.price)
          cardData.price = cardData?.card_prices[0]?.tcgplayer_price;

        const reSavedCard = await reFetchForSave(
          cardData,
          collectionId,
          "Collection",
          "CardInCollection"
        );
        console.log("Re-saved card:", reSavedCard);
        // const newCard = new CardInCollection(newCardData);
        // await newCard.save();
        collection.cards.push(reSavedCard?._id);
      }
      // processedCardIds.add(cardData.id); // Add card ID to the Set
    }
    await collection.save();
    await populatedUser.save();
    await collection.populate({
      path: "cards",
      model: "CardInCollection",
    });
    sendJsonResponse(res, 200, "Cards added to collection successfully.", {
      data: collection,
    });
  } catch (error) {
    console.error("Error adding cards to collection:", error);
    next(error);
  }
};
/**
 * STATUS:
 *![X] NOT OPERATIONAL
 * Removes cards from a collection and returns the updated collection data.
 * @param {Request} req - The request object
 * req.body = {
 * @param {Array} cardIds - The IDs of the cards to remove
 * }
 * @param {Response} res - The response object
 */
exports.removeCardsFromCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards } = req.body;

  if (!Array.isArray(cards)) {
    return res
      .status(400)
      .json({ message: "Invalid card data, expected an array." });
  }

  try {
    let populatedUser = await populateUserDataByContext(userId, [
      "collections",
    ]);

    const collection = populatedUser.allCollections.find(
      (coll) => coll._id.toString() === collectionId
    );

    if (!collection) {
      return res.status(404).json({ message: "Collection not found." });
    }

    // Remove specified cards
    const cardIdsToRemove = cards.map((c) => c._id);
    collection.cards = collection.cards.filter(
      (card) => !cardIdsToRemove.includes(card.id)
    );

    // Now, you'll have to remove these cards from the CardInCollection model as well
    await CardInCollection.deleteOne({
      _id: { $in: cardIdsToRemove },
      collectionId,
    });

    await collection.save();

    await populatedUser.save();

    populatedUser = await populateUserDataByContext(userId, ["collections"]);

    // return the updated collection from the populated user
    const updatedCollection = populatedUser.allCollections.find(
      (coll) => coll._id.toString() === collectionId
    );

    res.status(200).json({
      message: "Cards updated in collection successfully.",
      data: updatedCollection,
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    next(error);
  }
};
/**
 * Updates the cards in a collection and returns the updated collection data.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 */
exports.updateCardsInCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards, type } = req.body;

  if (!Array.isArray(cards)) {
    return res
      .status(400)
      .json({ message: "Invalid card data, expected an array." });
  }

  try {
    const populatedUser = await populateUserDataByContext(userId, [
      "collections",
    ]);
    const collection = populatedUser?.allCollections.find(
      (coll) => coll._id.toString() === collectionId
    );
    if (!collection) {
      return res.status(404).json({ message: "Collection not found." });
    }

    for (const cardData of cards) {
      const cardInCollection = await CardInCollection.findOne({
        id: cardData?.id,
      });

      if (cardInCollection) {
        console.log("Updating existing card:", cardInCollection.name.blue);
        // set the card's quantity to the updated quantity
        // if (cardInCollection.quantity !== cardData.quantity) {
        //   console.log("Updating card quantity");
        //   cardInCollection.quantity = cardData.quantity;
        // }
        if (type === "increment") {
          console.log("Incrementing card quantity");
          cardInCollection.quantity += 1;
        }
        if (type === "decrement") {
          console.log("Decrementing card quantity");
          cardInCollection.quantity -= 1;
        }
        console.log("Card quantity:", cardInCollection.quantity);

        // Save the card with pre-save hooks
        await cardInCollection.save();

        // Update collection's total quantity and price
        collection.totalQuantity += cardInCollection.quantity;
        collection.totalPrice +=
          cardInCollection.quantity * cardInCollection.price;

        // Update the card's contextual quantities and prices
      } else {
        console.log(`Card not found in collection: ${collectionId}`);
      }
    }

    await collection.save();

    await populatedUser.save();

    // Repopulate the collection
    await collection.populate({
      path: "cards",
      model: "CardInCollection",
      populate: deepPopulateCardFields(),
    });

    // // Filter out duplicate card objects
    // const uniqueCardsMap = new Map();
    // collection.cards.forEach((card) => uniqueCardsMap.set(card._id.toString(), card));
    // collection.cards = Array.from(uniqueCardsMap.values());

    res.status(200).json({
      message: "Cards updated in collection successfully.",
      data: collection,
    });
  } catch (error) {
    console.error("Error updating cards in collection:", error);
    next(error);
  }
};
exports.checkAndUpdateCardPrices = async (req, res, next) => {
  const { allUserIds } = fetchUserIdsFromUserSecurityData();
  if (allUserIds && allUserIds.length > 0) {
    console.log("SECTION Z: COMPLETE".green, allUserIds);
  }
  let priceChanges = [];
  for (const userId of allUserIds) {
    const userPopulated = await populateUserDataByContext(userId, [
      "collections",
    ]);
    for (const collection of userPopulated.allCollections) {
      for (const card of collection.cards) {
        const apiPrice = await fetchCardPrices(card.name); // Implement fetchCardPrices
        card.price = apiPrice;
        if (card.latestPrice.num !== apiPrice) {
          card.latestPrice.num = apiPrice;
          card.priceHistory.push({ timestamp: new Date(), num: apiPrice });
          await card.save();
          priceChanges.push(
            `Card: ${card.name}, Old Price: ${card.latestPrice.num}, New Price: ${apiPrice}`
          );
        } else {
          // Push current value to dailyPriceHistory if no change
          card.dailyPriceHistory.push({
            timestamp: new Date(),
            num: card.latestPrice.num,
          });
          await card.save();
        }
      }
    }
  }
};

// !--------------------------! COLLECTIONS !--------------------------!
// async function updateCardRefsAndSave(card, collectionId, quantity) {
//   // Assuming 'card' is a mongoose document that's already been fetched
//   // Check if the card already has a reference to this collection
//   const existingRefIndex = card.refs.findIndex(
//     (ref) => ref.collectionId.toString() === collectionId.toString()
//   );

//   if (existingRefIndex > -1) {
//     // Update quantity for existing collection reference
//     card.refs[existingRefIndex].quantity += quantity;
//   } else {
//     // Add a new reference to the collection with the specified quantity
//     card.refs.push({ collectionId, quantity });
//   }

//   // Save the updated card document
//   await card.save();
// }
// async function addNewCardToCollection(cardData, collectionId, quantity) {
//   // Create a new card with initial data, including a reference to the collection
//   const newCard = new Card({
//     ...cardData, // Spread operator to include all fields from cardData
//     refs: [{ collectionId, quantity }], // Initialize refs with the collectionId and quantity
//   });

//   // Save the new card to the database
//   await newCard.save();

//   return newCard;
// }
