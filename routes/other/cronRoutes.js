const express = require('express');
const { postLimiter, asyncHandler } = require('../../utils/utils');
const chartController = require('../../controllers/ChartController');
const { updateCollections, updateChartData } = require('./itemUpdates');
const { startCronJob, stopCronJob } = require('./cronJob');

const router = express.Router();

router.get('/charts/:userId', asyncHandler(chartController.getAllChartDataForUser));
// router.put('/charts/updateChart/:chartId', asyncHandler(chartController.updateChartData));
router.post('/charts/:userId/:chartId/updateChart', postLimiter, asyncHandler(updateChartData));
router.delete(
  '/charts/user/:userId/collection/:collectionId',
  asyncHandler(chartController.deleteDataItem),
);
router.get('/charts/update/:itemType/:itemId', asyncHandler(chartController.updateDataItem));
router.get('/update', asyncHandler(updateCollections));
router.get('/startCronJob', asyncHandler(startCronJob));
router.get('/stopCronJob', asyncHandler(stopCronJob));

module.exports = router;
