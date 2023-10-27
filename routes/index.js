const express = require('express');
const router = express.Router();

const userRoutes = require('./api/user');
// const orderRoutes = require('./api/order');
// const productRoutes = require('./api/product');
const cartRoutes = require('./api/cart');
const cardRoutes = require('./api/card');
const ygoproRoutes = require('./api/ygopro');
const deckRoutes = require('./api/deck');
const stripeRoutes = require('./other/stripe');
// const tcgScraperRoutes = require('../scrape');
const cardImageRoutes = require('./api/cardimage');
const directedResponsesRoutes = require('./api/general');
// const cronRoutes = require('./other/cronRoutes');

// router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
// router.use('/products', productRoutes);
router.use('/carts', cartRoutes);
router.use('/cards', cardRoutes);
router.use('/decks', deckRoutes);
router.use('/cards/ygopro', ygoproRoutes);
router.use('/stripe', stripeRoutes);
// router.use('/scrape', tcgScraperRoutes);
router.use('/card-images', cardImageRoutes);

router.use('/directedResponses', directedResponsesRoutes);
// router.use('/chart-data', cronRoutes);
// router.use('/cron', cronRoutes);

module.exports = router;
