const express = require('express');
const { asyncHandler } = require('../../utils/utils');
const chartController = require('../../controllers/chartController');
const { updateCollections } = require('./collectionManager');
const { cronJob } = require('./cronJob');
const { verifyToken } = require('../../services/auth');

const router = express.Router();

router.get('/charts/:userId', verifyToken, asyncHandler(chartController.getAllChartDataForUser));
// router.put('/charts/updateChart/:chartId', asyncHandler(chartController.updateChartData));
router.post(
  '/charts/:userId/:chartId/updateChart',
  verifyToken,
  asyncHandler(chartController.updateChartData),
);
router.delete(
  '/charts/user/:userId/collection/:collectionId',
  asyncHandler(chartController.deleteDataItem),
);
router.get(
  '/charts/update/:itemType/:itemId',
  verifyToken,
  asyncHandler(chartController.updateDataItem),
);
router.get('/update', verifyToken, asyncHandler(updateCollections));
router.get('/startCronJob', verifyToken, asyncHandler(cronJob));
// router.get('/stopCronJob', asyncHandler(cronJob.sto));

module.exports = router;
