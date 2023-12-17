const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/UserController.js');
const { verifyToken } = require('../../services/auth.js');
const { asyncHandler } = require('../../utils/utils.js');
// const { validateObjectId } = require('../../controllers/userControllerUtilities.js');

router.post('/signup', asyncHandler(UserController.signup));
router.post('/signin', asyncHandler(UserController.signin));

router.get('/profile', verifyToken, asyncHandler(UserController.getProfile));
router.put('/profile/:id', verifyToken, asyncHandler(UserController.updateProfile));
router.delete('/profile/:id', verifyToken, asyncHandler(UserController.deleteProfile));

router.get('/:id', asyncHandler(UserController.getUserById));

// get cart by user id
router.get('/:userId/cart', asyncHandler(UserController.getUserCart));
router.post('/:userId/cart/createCart', asyncHandler(UserController.createEmptyCart));
router.put('/:userId/cart/:cartId/update', asyncHandler(UserController.updateCart));

router.get('/:userId/decks', asyncHandler(UserController.getAllDecksForUser));
router.put('/:userId/decks/:deckId/updateDeck', asyncHandler(UserController.updateAndSyncDeck));
router.post('/:userId/decks/createDeck', asyncHandler(UserController.createNewDeck));
router.delete('/:userId/decks/:deckId/deleteDeck', asyncHandler(UserController.deleteDeck));
router.post('/:userId/decks/:deckId/add', asyncHandler(UserController.addCardsToDeck));
router.post('/:userId/decks/:deckId/remove', asyncHandler(UserController.removeCardsFromDeck));
router.put('/:userId/decks/:deckId/update', asyncHandler(UserController.updateCardsInDeck));
router.put('/:userId/decks/:deckId/deckDetails', asyncHandler(UserController.updateDeckDetails));

router.post('/:userId/collections', asyncHandler(UserController.createNewCollection));
router.get('/:userId/collections', asyncHandler(UserController.getAllCollectionsForUser));
router.post(
  '/:userId/collections/:collectionId/add',
  asyncHandler(UserController.addCardsToCollection),
);
router.post(
  '/:userId/collections/:collectionId/remove',
  asyncHandler(UserController.removeCardsFromCollection),
);
router.put(
  '/:userId/collections/:collectionId/update',
  asyncHandler(UserController.updateCardsInCollection),
);
router.put(
  '/:userId/collections/:collectionId/updateChartData',
  asyncHandler(UserController.updateChartDataInCollection),
);
router.put(
  '/:userId/collections/:collectionId',
  asyncHandler(UserController.updateAndSyncCollection),
);
router.delete('/:userId/collections/:collectionId', asyncHandler(UserController.deleteCollection));

module.exports = router;
