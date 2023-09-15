const express = require('express');
const scrapeController = require('../../controllers/ScrapeController');

const router = express.Router();

// Modified to use the scrapeController methods directly.
router.get('/', scrapeController.scrapeGetHandler);
router.post('/', scrapeController.scrapePostHandler);

module.exports = router;
