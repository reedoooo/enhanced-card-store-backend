// imageRoutes.js
const express = require('express');
const router = express.Router();
const ImageController = require('../../controllers/Images/ImageController');
const { asyncHandler } = require('../../utils/utils');

router.get('/download-card', asyncHandler(ImageController.downloadCardImage));

module.exports = router;
