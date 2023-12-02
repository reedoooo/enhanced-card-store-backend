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

router.get('/:userId/decks', asyncHandler(UserController.getAllDecksForUser));
router.put('/:userId/decks/:deckId', asyncHandler(UserController.updateAndSyncDeck));
// router.post('/:userId/newDeck', asyncHandler(UserController.createNewDeck));
router.post('/:userId/decks', asyncHandler(UserController.createNewDeck));

router.post('/:userId/collections', asyncHandler(UserController.createNewCollection));
router.get('/:userId/collections', asyncHandler(UserController.getAllCollectionsForUser));
router.post(
  '/:userId/collections/:collectionId/updateCards',
  asyncHandler(UserController.addCardsToCollection),
);
router.delete(
  '/:userId/collections/:collectionId/removeCards',
  asyncHandler(UserController.removeCardsFromCollection),
);
router.put(
  '/:userId/collections/:collectionId/updateCards',
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
