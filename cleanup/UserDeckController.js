// const { CardInDeck } = require("../models/Card");
// const { Deck } = require("../models/Collection");
// const {
//   populateUserDataByContext,
//   fetchPopulatedUserContext,
//   findUserContextItem,
// } = require("./User/dataUtils");
// const { reFetchForSave } = require("./User/helpers");
// const logger = require("../configs/winston");
// const { addOrUpdateCards, removeCards } = require("./User/cardUtilities");
// const {
//   sendJsonResponse,
//   validateContextEntityExists,
// } = require("../utils/utils");

// // !--------------------------! DECKS !--------------------------!
// exports.getAllDecksForUser = async (req, res, next) => {
//   try {
//     const populatedUser = await fetchPopulatedUserContext(req.params.userId, [
//       "decks",
//     ]);
//     validateContextEntityExists(populatedUser, "User not found", 404, res);
//     sendJsonResponse(
//       res,
//       200,
//       `Fetched decks for user ${req.params.userId}`,
//       populatedUser.allDecks
//     );
//   } catch (error) {
//     next(error);
//   }
// };
// exports.updateDeckDetails = async (req, res, next) => {
//   const { name, description, tags, color } = req.body;
//   try {
//     const populatedUser = await fetchPopulatedUserContext(req.params.userId, [
//       "decks",
//     ]);
//     const deck = findUserDeck(populatedUser, req.params.deckId);
//     validateContextEntityExists(deck, "Deck not found", 404, res);
//     Object.assign(deck, { name, description, tags, color });
//     await deck.save();
//     sendJsonResponse(res, 200, `Deck updated successfully.`, deck);
//   } catch (error) {
//     next(error);
//   }
// };
// exports.createNewDeck = async (req, res, next) => {
//   const { userId } = req.params;
//   const { name, description, tags, color, cards } = req.body;

//   try {
//     const user = await fetchPopulatedUserContext(userId, ["decks"]);
//     if (user.allDecks.some((d) => d.name === name)) {
//       return sendJsonResponse(res, 400, "Deck with this name already exists");
//     }
//     const newDeck = new Deck({
//       userId,
//       name,
//       description,
//       tags,
//       color,
//       cards,
//       collectionModel: "Deck",
//     });
//     await newDeck.save();
//     user.allDecks.push(newDeck._id);
//     await user.save();

//     sendJsonResponse(res, 201, "New deck created successfully", newDeck);
//   } catch (error) {
//     next(error);
//   }
// };
// exports.deleteDeck = async (req, res, next) => {
//   const { userId, deckId } = req.params;

//   try {
//     const user = await fetchPopulatedUserContext(userId, ["decks"]);
//     const deckIndex = user.allDecks.findIndex(
//       (d) => d._id.toString() === deckId
//     );
//     validateContextEntityExists(deckIndex !== -1, "Deck not found", 404, res);

//     user.allDecks.splice(deckIndex, 1);
//     await user.save();

//     sendJsonResponse(res, 200, "Deck deleted successfully", {
//       deletedDeckId: deckId,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// exports.addCardsToDeck = async (req, res, next) => {
//   try {
//     const { userId, deckId } = req.params;
//     let cardsArray = [req.body.cards];
//     !Array.isArray(cardsArray)
//       ? logger.error("Invalid card data, expected an array.")
//       : console.info("Cards array received:", cardsArray);

//     const populatedUser = await fetchPopulatedUserContext(req.params.userId, [
//       "decks",
//     ]);
//     const deck = findUserContextItem(populatedUser, "allDecks", deckId);
//     await addOrUpdateCards(deck, cardsArray, deckId, "Deck", CardInDeck);

//     sendJsonResponse(res, 200, "Cards added to deck successfully.", {
//       data: deck,
//     });
//   } catch (error) {
//     logger.error("Error adding cards to deck:", error);
//     next(error);
//   }
// };
// exports.removeCardsFromDeck = async (req, res, next) => {
//   const { userId, deckId } = req.params;
//   const { cards } = req.body;

//   try {
//     const populatedUser = await fetchPopulatedUserContext(userId, ["decks"]);
//     const deck = findUserDeck(populatedUser, deckId);
//     validateContextEntityExists(deck, "Deck not found", 404, res);
//     await removeCards(deck, cards, "deck", CardInDeck);
//     sendJsonResponse(res, 200, "Cards removed from deck successfully.", {
//       data: deck,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
