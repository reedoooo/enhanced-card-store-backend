// !--------------------------! COLLECTIONS !--------------------------!
const { CardInCollection } = require("../../../../src/models/Card");
const { Collection } = require("../../../../src/models/Collection");
const { fetchCardPrices } = require("../../Cards/helpers");
const {
  populateUserDataByContext,
  deepPopulateCardFields,
  fetchPopulatedUserContext,
  findUserContextItem,
} = require("../dataUtils");
const {
  setupDefaultCollectionsAndCards,
  reFetchForSave,
  fetchUserIdsFromUserSecurityData,
} = require("../helpers");
const logger = require("../../../configs/winston");
const {
  sendJsonResponse,
  validateContextEntityExists,
} = require("../../../utils/utils");

// ! COLLECTION ROUTES (GET, CREATE, UPDATE, DELETE) !
/**
 * Returns all collections for a user.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
exports.getAllCollectionsForUser = async (req, res, next) => {
  try {
    // const populatedUser = await fetchPopulatedUserCollections(
    //   req.params.userId
    // );
    const populatedUser = await fetchPopulatedUserContext(req.params.userId, [
      "collections",
    ]);
    validateContextEntityExists(populatedUser, "User not found", 404, res);

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
    const populatedUser = await fetchPopulatedUserContext(req.params.userId, [
      "collections",
    ]);
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
    const populatedUser = await fetchPopulatedUserContext(req.params.userId, [
      "collections",
    ]);
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
    const populatedUser = await fetchPopulatedUserContext(req.params.userId, [
      "collections",
    ]);
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
  let { cards } = req.body; // Assuming 'cards' can be an object or an array
  if (!Array.isArray(cards)) {
    cards = [cards]; // Convert the object to an array containing that object
  }

  logger.info("Processing cards:", cards);
  try {
    const populatedUser = await fetchPopulatedUserContext(req.params.userId, [
      "collections",
    ]);
    const collection = findUserContextItem(populatedUser, 'allCollections', req.params.collectionId);
    for (const cardData of cards) {
      console.log("Processing card:".red, cardData.id);
      console.log(
        "IDS OF ALL CARDS IN COLLECTION:".red,
        collection.cards.map((c) => c.id)
      );
      let foundCard = collection?.cards?.find(
        (c) => c.id.toString() === cardData.id
      );
      if (foundCard) {
        let cardInCollection = await CardInCollection.findById(foundCard._id);
        if (cardInCollection) {
          console.log("Updating existing card:", cardInCollection.name.blue);
          console.log("START QUANTITY: ".red, cardInCollection.quantity);
          console.log("START TOTAL PRICE: ".red, cardInCollection.totalPrice);
          cardInCollection.quantity += 1;
          cardInCollection.totalPrice =
            cardInCollection.quantity * cardInCollection.price;
          await cardInCollection.save();
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
          req.params.collectionId,
          "Collection",
          "CardInCollection"
        );
        console.log("Re-saved card:", reSavedCard);
        collection.cards.push(reSavedCard?._id);
      }
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
