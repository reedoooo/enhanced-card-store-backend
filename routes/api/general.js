const express = require('express');
const router = express.Router();
const userControllerResponses = require('../../controllers/userControllerResponses');
const { asyncHandler } = require('../../utils/utils.js');
const { logger } = require('../../middleware/infoLogger.js');

router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    try {
      await userControllerResponses.getDirectedResponses(req, res, next);
    } catch (error) {
      next(error);
    }
  }),
);

router.use((error, req, res, next) => {
  logger.errorLogger('Error:', error);
  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || 'An unexpected error occurred.';
  res.status(statusCode).send({ error: 'Server error', details: errorMessage });
});

module.exports = router;
