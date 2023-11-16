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

router.post(
  '/:userId/collections',
  // validateObjectId,
  asyncHandler(UserController.createNewCollection),
);
router.get(
  '/:userId/collections',
  // validateObjectId,
  asyncHandler(UserController.getAllCollectionsForUser),
);
router.put(
  '/:userId/collections/:collectionId/updateCards',
  // validateObjectId,
  asyncHandler(UserController.updateCardsInCollection),
);
router.put(
  '/:userId/collections/:collectionId/updateChartData',
  // validateObjectId,
  asyncHandler(UserController.updateChartDataInCollection),
);
router.put(
  '/:userId/collections/:collectionId',
  // validateObjectId,
  asyncHandler(UserController.updateAndSyncCollection),
);

router.delete('/:userId/collections/:collectionId', asyncHandler(UserController.deleteCollection));

// Error handler
// router.use(unifiedErrorHandler);

// router.use((error, req, res, next) => {
//   // Log the error
//   logger.error('Error:', error);
//   handleErrors(res, error, next);
//   // If the response has already been sent, forward the error to the default Express error handler
//   if (res.headersSent) {
//     return next(error);
//   }

//   // Pass the error to your directError function for consistent error handling
//   directError(res, error.message, 'SERVER_ERROR', error, next);
// });

module.exports = router;
