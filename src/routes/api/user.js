const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.js');
const cartController = require('../../controllers/cart.js');
const deckController = require('../../controllers/deck.js');
const collectionController = require('../../controllers/collection.js');
const { signin, signup, signout, checkToken, getUserData, updateUserData } = userController;
const {
  getAllDecksForUser,
  updateDeckDetails,
  createNewDeck,
  deleteDeck,
  addCardsToDeck,
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
router.get('/:userId/decks/all', getAllDecksForUser);
router.get('/:userId/decks/get/:deckId', getDeckById);
router.post('/:userId/decks/create', createNewDeck);
router.put('/:userId/decks/update/:deckId', updateDeckDetails);
router.delete('/:userId/decks/delete/:deckId', deleteDeck);
router.post('/:userId/decks/:deckId/cards/add', addCardsToDeck);

// COLLECTION ROUTES
router.get('/:userId/collections/all', getAllCollectionsForUser);
router.post('/:userId/collections/create', createNewCollection);
router.put('/:userId/collections/update/:collectionId', updateExistingCollection);
router.delete('/:userId/collections/delete/:collectionId', deleteExistingCollection);

// COLLECTION DATA ROUTES
router.post('/:userId/collections/:collectionId/cards/add', addCardsToCollection);
router.put('/:userId/collections/:collectionId/cards/:cardId/remove', removeCardsFromCollection);

// CART ROUTES
router.get('/:userId/cart/all', getUserCart);
router.post('/:userId/cart/create', createEmptyCart);
router.post('/:userId/cart/cards/add', addCardsToCart);
router.put('/:userId/cart/cards/:cardId/remove', removeCardsFromCart);

module.exports = router;
