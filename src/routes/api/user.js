const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/User/User/UserController.js');

const UserCartController = require('../../controllers/User/Cart/UserCartController.js');
const UserDeckController = require('../../controllers/User/Deck/UserDeckController.js');
const UserCollectionController = require('../../controllers/User/Collection/UserCollectionController.js');
const { asyncHandler } = require('../../utils/utils.js');

// USER SIGNUP AND SIGNIN ROUTES
router.post('/signup', asyncHandler(UserController.signup));
router.post('/signin', asyncHandler(UserController.signin));
router.post('/signout', asyncHandler(UserController.signout));
router.get('/checkToken', asyncHandler(UserController.checkToken));

// USER DATA ROUTES
router.get('/:userId/userData', asyncHandler(UserController.getUserData));
router.put('/:userId/userData/update', asyncHandler(UserController.updateUserData));

// DECK ROUTES
router.get('/:userId/decks/allDecks', asyncHandler(UserDeckController.getAllDecksForUser));
router.post('/:userId/decks/create', asyncHandler(UserDeckController.createNewDeck));
router.put(
  '/:userId/decks/:deckId/deckDetails',
  asyncHandler(UserDeckController.updateDeckDetails),
);
router.delete('/:userId/decks/:deckId/delete', asyncHandler(UserDeckController.deleteDeck));
router.post('/:userId/decks/:deckId/cards/add', asyncHandler(UserDeckController.addCardsToDeck));
router.put(
  '/:userId/decks/:deckId/cards/remove',
  asyncHandler(UserDeckController.removeCardsFromDeck),
);

// COLLECTION ROUTES
router.get(
  '/:userId/collections/allCollections',
  asyncHandler(UserCollectionController.getAllCollectionsForUser),
);
router.post(
  '/:userId/collections/create',
  asyncHandler(UserCollectionController.createNewCollection),
);
router.put(
  '/:userId/collections/:collectionId/update',
  asyncHandler(UserCollectionController.updateExistingCollection),
);
router.delete(
  '/:userId/collections/:collectionId/delete',
  asyncHandler(UserCollectionController.deleteExistingCollection),
);

// COLLECTION DATA ROUTES
router.post(
  '/:userId/collections/:collectionId/cards/add',
  asyncHandler(UserCollectionController.addCardsToCollection),
);
router.put(
  '/:userId/collections/:collectionId/cards/remove',
  asyncHandler(UserCollectionController.removeCardsFromCollection),
);
router.put(
  '/:userId/collections/:collectionId/cards/update',
  asyncHandler(UserCollectionController.updateCardsInCollection),
);

// CART ROUTES
router.get('/:userId/cart', asyncHandler(UserCartController.getUserCart));
router.post('/:userId/cart/createCart', asyncHandler(UserCartController.createEmptyCart));
router.post('/:userId/cart/add', asyncHandler(UserCartController.addCardsToCart));
router.delete('/:userId/cart/remove', asyncHandler(UserCartController.removeCardsFromCart));
router.put('/:userId/cart/update', asyncHandler(UserCartController.updateCart));

module.exports = router;
