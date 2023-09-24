const express = require('express');
const chartController = require('../../controllers/ChartController');

const router = express.Router();
const rateLimit = require('express-rate-limit');

// Define the rate limit for POST requests
const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute in milliseconds
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests created from this IP, please try again after a minute',
});
// General Async Handler
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      next(error);
    });
  };
}

// GET all data
router.get('/', asyncHandler(chartController.getAllData));

// GET all data for a specific user
router.get('/:userId', asyncHandler(chartController.getAllChartDataForUser));

// PUT update a specific collection by collectionId
router.put('/updateChart/:chartId', asyncHandler(chartController.updateChartData));

// POST create a new empty collection for a specific user
// router.post('/updateChart/:userId', asyncHandler(chartController.createEmptyDataSet));
router.post('/updateChart/:userId', postLimiter, asyncHandler(chartController.addNewDataSet));

// DELETE delete a specific collection for a specific user
router.delete(
  '/user/:userId/collection/:collectionId',
  asyncHandler(chartController.deleteDataItem),
);

router.get('/update/:itemType/:itemId', asyncHandler(chartController.updateDataItem));

// Uncomment if you need to decrease item quantity
// router.put('/:collectionId/decrease', asyncHandler(collectionController.updateAndSyncCollection));

// Uncomment if you need to create or update a collection (not just an empty one)
// router.post('/', asyncHandler(chartController.createOrUpdateCollection));

module.exports = router;
