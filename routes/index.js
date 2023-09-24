const express = require('express');
const router = express.Router();

const userRoutes = require('./api/user');
const orderRoutes = require('./api/order');
const productRoutes = require('./api/product');
const cartRoutes = require('./api/cart');
const cardRoutes = require('./api/card');
const ygoproRoutes = require('./api/ygopro');
const deckRoutes = require('./api/deck');
// const collectionRoutes = require('./api/collection');
const stripeRoutes = require('./other/stripe');
const tcgScraperRoutes = require('./other/scrape');
const cardImageRoutes = require('./api/cardimage');
const cronRoutes = require('./other/collection-cron');
const chartRoutes = require('./api/chart');

router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/carts', cartRoutes);
router.use('/cards', cardRoutes); // Use card routes
router.use('/decks', deckRoutes); // Use card routes
// router.use('/collections', collectionRoutes);
router.use('/cards/ygopro', ygoproRoutes); // Use card routes
router.use('/stripe', stripeRoutes);
router.use('/scrape', tcgScraperRoutes);
router.use('/card-images', cardImageRoutes);
router.use('/cron', cronRoutes);
router.use('/chart-data', chartRoutes);

module.exports = router;
