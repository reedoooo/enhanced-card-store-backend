const express = require("express");
const router = express.Router();
const userController = require("../../controllers/user.js");
const cartController = require("../../controllers/cart.js");
const deckController = require("../../controllers/deck.js");
const collectionController = require("../../controllers/collection.js");
const { asyncHandler } = require("../../utils/utils.js");
const { signin, signup, signout, checkToken, getUserData, updateUserData } =
  userController;
const {
  getAllDecksForUser,
  updateDeckDetails,
  createNewDeck,
  deleteDeck,
  addCardsToDeck,
  removeCardsFromDeck,
} = deckController;
const {
  getAllCollectionsForUser,
  updateExistingCollection,
  createNewCollection,
  deleteExistingCollection,
  addCardsToCollection,
  removeCardsFromCollection,
} = collectionController;
const {
  getUserCart,
  createEmptyCart,
  addCardsToCart,
  removeCardsFromCart,
  updateCardsInCart,
} = cartController;

// USER SIGNUP AND SIGNIN ROUTES
router.post("/signup", asyncHandler(signup));
router.post("/signin", asyncHandler(signin));
router.post("/signout", asyncHandler(signout));
router.get("/checkToken", asyncHandler(checkToken));
// USER DATA ROUTES
router.get("/:userId/userData", asyncHandler(getUserData));
router.put("/:userId/userData/update", asyncHandler(updateUserData));

// DECK ROUTES
router.get("/:userId/decks/allDecks", asyncHandler(getAllDecksForUser));
router.post("/:userId/decks/create", asyncHandler(createNewDeck));
router.put(
  "/:userId/decks/:deckId/deckDetails",
  asyncHandler(updateDeckDetails)
);
router.delete("/:userId/decks/:deckId/delete", asyncHandler(deleteDeck));
router.post("/:userId/decks/:deckId/cards/add", asyncHandler(addCardsToDeck));
router.put(
  "/:userId/decks/:deckId/cards/remove",
  asyncHandler(removeCardsFromDeck)
);

// COLLECTION ROUTES
router.get(
  "/:userId/collections/allCollections",
  asyncHandler(getAllCollectionsForUser)
);
router.post("/:userId/collections/create", asyncHandler(createNewCollection));
router.put(
  "/:userId/collections/:collectionId/update",
  asyncHandler(updateExistingCollection)
);
router.delete(
  "/:userId/collections/:collectionId/delete",
  asyncHandler(deleteExistingCollection)
);

// COLLECTION DATA ROUTES
router.post(
  "/:userId/collections/:collectionId/cards/add",
  asyncHandler(addCardsToCollection)
);
router.put(
  "/:userId/collections/:collectionId/cards/remove",
  asyncHandler(removeCardsFromCollection)
);

// CART ROUTES
router.get("/:userId/cart", asyncHandler(getUserCart));
router.post("/:userId/cart/create", asyncHandler(createEmptyCart));
router.post("/:userId/cart/add", asyncHandler(addCardsToCart));
router.delete("/:userId/cart/remove", asyncHandler(removeCardsFromCart));
router.put("/:userId/cart/update", asyncHandler(updateCardsInCart));

module.exports = router;
