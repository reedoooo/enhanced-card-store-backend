const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/User/User/UserController.js');
// const UserAuthController = require('../../controllers/User/User/UserAuthController.js');

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
router.put('/:userId/decks/:deckId/updateDeck', asyncHandler(UserDeckController.updateAndSyncDeck));
router.post('/:userId/decks/createDeck', asyncHandler(UserDeckController.createNewDeck));
router.delete('/:userId/decks/:deckId/deleteDeck', asyncHandler(UserDeckController.deleteDeck));
router.post('/:userId/decks/:deckId/add', asyncHandler(UserDeckController.addCardsToDeck));
// router.post('/:userId/decks/:deckId/remove', asyncHandler(UserDeckController.removeCardsFromDeck));
router.delete(
  '/:userId/decks/:deckId/remove',
  asyncHandler(UserDeckController.removeCardsFromDeck),
);
router.put('/:userId/decks/:deckId/update', asyncHandler(UserDeckController.updateCardsInDeck));
router.put(
  '/:userId/decks/:deckId/deckDetails',
  asyncHandler(UserDeckController.updateDeckDetails),
);

// COLLECTION ROUTES
router.post(
  '/:userId/collections/create',
  asyncHandler(UserCollectionController.createNewCollection),
);
router.get(
  '/:userId/collections/allCollections',
  asyncHandler(UserCollectionController.getAllCollectionsForUser),
);
router.put(
  '/:userId/collections/:collectionId',
  asyncHandler(UserCollectionController.updateAndSyncCollection),
);
router.delete(
  '/:userId/collections/:collectionId',
  asyncHandler(UserCollectionController.deleteCollection),
);
router.post(
  '/:userId/collections/:collectionId/add',
  asyncHandler(UserCollectionController.addCardsToCollection),
);
router.put(
  '/:userId/collections/allCollections/automatedPriceUpdate',
  asyncHandler(UserCollectionController.checkAndUpdateCardPrices),
);
// router.post(
//   '/:userId/collections/:collectionId/remove',
//   asyncHandler(UserCollectionController.removeCardsFromCollection),
// );
router.delete(
  '/:userId/collections/:collectionId/remove',
  asyncHandler(UserCollectionController.removeCardsFromCollection),
);
router.put(
  '/:userId/collections/:collectionId/update',
  asyncHandler(UserCollectionController.updateCardsInCollection),
);
router.put(
  '/:userId/collections/:collectionId/updateChartData',
  asyncHandler(UserCollectionController.updateChartDataInCollection),
);

// CART ROUTES
router.get('/:userId/cart', asyncHandler(UserCartController.getUserCart));
router.post('/:userId/cart/createCart', asyncHandler(UserCartController.createEmptyCart));
router.post('/:userId/cart/:cartId/add', asyncHandler(UserCartController.addCardsToCart));
router.delete('/:userId/cart/:cartId/remove', asyncHandler(UserCartController.removeCardsFromCart));
router.put('/:userId/cart/:cartId/update', asyncHandler(UserCartController.updateCart));

module.exports = router;
