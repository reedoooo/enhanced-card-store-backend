//TCGPlayerRoutes.js
const express = require('express');
const router = express.Router();
const TCGPlayerController = require('../../controllers/TCGPlayerController');

router.post('/token', TCGPlayerController.generateToken);
router.get('/catalog/categories', TCGPlayerController.getCatalogCategories);
router.post('/authorize/authCode', TCGPlayerController.authorizeAuthCode);

module.exports = router;