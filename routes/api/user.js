const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../services/auth.js');
const UserController = require('../../controllers/UserController.js');

// General Async Handler
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      next(error);
    });
  };
}

router.post('/signup', asyncHandler(UserController.signup));
router.post('/signin', asyncHandler(UserController.signin));
router.get('/profile', verifyToken, asyncHandler(UserController.getProfile));
router.put(
  '/profile/:id',
  verifyToken,
  asyncHandler(UserController.updateProfile),
);
router.delete(
  '/profile/:id',
  verifyToken,
  asyncHandler(UserController.deleteProfile),
);
router.get('/:id', asyncHandler(UserController.getUserById));
router.get('/:userId/decks', asyncHandler(UserController.getAllDecksForUser));
router.put('/:userId/:deckId', asyncHandler(UserController.updateAndSyncDeck));
router.post('/:userId/newDeck', asyncHandler(UserController.createNewDeck));

router.use((error, req, res, next) => {
  console.error('Middleware error:', error); // Logging the error can be useful for debugging

  if (error.isJoi) {
    // If the error is from a validation (Joi for instance)
    return res
      .status(400)
      .send({ error: 'Validation error.', details: error.details });
  }

  if (error.name === 'JsonWebTokenError') {
    // If the error is a JWT error (unauthorized)
    return res
      .status(401)
      .send({ error: 'Unauthorized', details: 'Invalid token' });
  }

  if (error.name === 'CastError') {
    // If the error is a Mongoose invalid ObjectId
    return res
      .status(400)
      .send({ error: 'Invalid Id format', details: error.message });
  }

  if (error.name === 'DocumentNotFound') {
    // If the document was not found in DB
    return res.status(404).send({
      error: 'Not found',
      details: 'The requested resource could not be found.',
    });
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    // If the error is a MongoDB unique constraint violation
    return res
      .status(409)
      .send({ error: 'Resource conflict', details: 'Duplicate entry found.' });
  }

  // General Error (this should be your last "catch-all" route)
  return res
    .status(500)
    .send({ error: 'Server error', details: 'An unexpected error occurred.' });
});

module.exports = router;
