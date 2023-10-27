const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/UserController.js');
const { verifyToken } = require('../../services/auth.js');
const { asyncHandler } = require('../../utils/utils.js');
const { logger } = require('../../middleware/infoLogger.js');
const { directError } = require('../../controllers/userControllerResponses.js');
// const { handleValidationErrors } = require('../../controllers/userControllerUtilities.js');

router.post('/signup', asyncHandler(UserController.signup));
router.post('/signin', asyncHandler(UserController.signin));

router.get('/profile', verifyToken, asyncHandler(UserController.getProfile));
router.put('/profile/:id', verifyToken, asyncHandler(UserController.updateProfile));
router.delete('/profile/:id', verifyToken, asyncHandler(UserController.deleteProfile));

router.get('/:id', asyncHandler(UserController.getUserById));

router.get('/:userId/decks', asyncHandler(UserController.getAllDecksForUser));
router.put('/:userId/decks/:deckId', asyncHandler(UserController.updateAndSyncDeck));
router.post('/:userId/newDeck', asyncHandler(UserController.createNewDeck));

router.get('/:userId/collections', asyncHandler(UserController.getAllCollectionsForUser));
router.put(
  '/:userId/collections/:collectionId',
  asyncHandler(UserController.updateAndSyncCollection),
);
router.post(
  '/:userId/collections/newCollection/:userId',
  asyncHandler(UserController.createNewCollection),
);
router.delete('/:userId/collections/:collectionId', asyncHandler(UserController.deleteCollection));

// Error handler
router.use((error, req, res, next) => {
  // Log the error
  logger.error('Error:', error);

  // If the response has already been sent, forward the error to the default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Pass the error to your directError function for consistent error handling
  directError(res, error.message, 'SERVER_ERROR', error, next);
});

module.exports = router;
