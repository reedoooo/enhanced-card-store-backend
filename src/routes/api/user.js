const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.js');
const cartController = require('../../controllers/cart.js');
const deckController = require('../../controllers/deck.js');
const collectionController = require('../../controllers/collection.js');
const { signin, signup, signout, checkToken, getUserData, updateUserData } =
  userController;
const {
  getAllDecksForUser,
  updateDeckDetails,
  createNewDeck,
  deleteDeck,
  addCardsToDeck,
  removeCardsFromDeck,
  getDeckById,
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
// async function fetchAndValidateUser(req, res, next) {
//   try {
//       const user = await User.findById(req.params.userId);
//       req.user = user;
//       next(); // Proceed to the next middleware/route handler
//   } catch (error) {
//       next(error); // Forward error to the error handling middleware
//   }
// }

// USER SIGNUP AND SIGNIN ROUTES
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signout', signout);
router.get('/checkToken', checkToken);

// USER DATA ROUTES
router.get('/:userId/userData', getUserData);
router.put('/:userId/userData/update', updateUserData);

// DECK ROUTES
router.get('/:userId/decks/allDecks', getAllDecksForUser);
router.get('/:userId/decks/:deckId', getDeckById);
router.post('/:userId/decks/create', createNewDeck);
router.put('/:userId/decks/:deckId/deckDetails', updateDeckDetails);
router.delete('/:userId/decks/:deckId/delete', deleteDeck);
router.post('/:userId/decks/:deckId/cards/add', addCardsToDeck);
router.put('/:userId/decks/:deckId/cards/remove', removeCardsFromDeck);

// COLLECTION ROUTES
router.get('/:userId/collections/allCollections', getAllCollectionsForUser);
router.post('/:userId/collections/create', createNewCollection);
router.put(
  '/:userId/collections/:collectionId/update',
  updateExistingCollection,
);
router.delete(
  '/:userId/collections/:collectionId/delete',
  deleteExistingCollection,
);

// COLLECTION DATA ROUTES
router.post(
  '/:userId/collections/:collectionId/cards/add',
  addCardsToCollection,
);
router.put(
  '/:userId/collections/:collectionId/cards/remove',
  removeCardsFromCollection,
);

// CART ROUTES
router.get('/:userId/cart', getUserCart);
router.post('/:userId/cart/create', createEmptyCart);
router.post('/:userId/cart/add', addCardsToCart);
router.delete('/:userId/cart/remove', removeCardsFromCart);
router.put('/:userId/cart/update', updateCardsInCart);

module.exports = router;
// // USER SIGNUP AND SIGNIN ROUTES
// router.post("/signup", asyncHandler(signup));
// router.post("/signin", asyncHandler(signin));
// router.post("/signout", asyncHandler(signout));
// router.get("/checkToken", asyncHandler(checkToken));
// // USER DATA ROUTES
// router.get("/:userId/userData", asyncHandler(getUserData));
// router.put("/:userId/userData/update", asyncHandler(updateUserData));

// // DECK ROUTES
// router.get("/:userId/decks/allDecks", asyncHandler(getAllDecksForUser));
// router.post("/:userId/decks/create", asyncHandler(createNewDeck));
// router.put(
//   "/:userId/decks/:deckId/deckDetails",
//   asyncHandler(updateDeckDetails)
// );
// router.delete("/:userId/decks/:deckId/delete", asyncHandler(deleteDeck));
// router.post("/:userId/decks/:deckId/cards/add", asyncHandler(addCardsToDeck));
// router.put(
//   "/:userId/decks/:deckId/cards/remove",
//   asyncHandler(removeCardsFromDeck)
// );

// // COLLECTION ROUTES
// router.get(
//   "/:userId/collections/allCollections",
//   asyncHandler(getAllCollectionsForUser)
// );
// router.post("/:userId/collections/create", asyncHandler(createNewCollection));
// router.put(
//   "/:userId/collections/:collectionId/update",
//   asyncHandler(updateExistingCollection)
// );
// router.delete(
//   "/:userId/collections/:collectionId/delete",
//   asyncHandler(deleteExistingCollection)
// );

// // COLLECTION DATA ROUTES
// router.post(
//   "/:userId/collections/:collectionId/cards/add",
//   asyncHandler(addCardsToCollection)
// );
// router.put(
//   "/:userId/collections/:collectionId/cards/remove",
//   asyncHandler(removeCardsFromCollection)
// );

// // CART ROUTES
// router.get("/:userId/cart", asyncHandler(getUserCart));
// router.post("/:userId/cart/create", asyncHandler(createEmptyCart));
// router.post("/:userId/cart/add", asyncHandler(addCardsToCart));
// router.delete("/:userId/cart/remove", asyncHandler(removeCardsFromCart));
// router.put("/:userId/cart/update", asyncHandler(updateCardsInCart));

// module.exports = router;
