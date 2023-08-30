const express = require('express');
const router = express.Router();

const userRoutes = require('./api/user');
const orderRoutes = require('./api/order');
const productRoutes = require('./api/product');
const cartRoutes = require('./api/cart');
const cardRoutes = require('./api/card');
const ygoproRoutes = require('./api/ygopro');
const deckRoutes = require('./api/deck');
const stripeRoutes = require('./other/stripe');
const tcgScraperRoutes = require('./other/scrape');

router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/carts', cartRoutes);
router.use('/cards', cardRoutes); // Use card routes
router.use('/decks', deckRoutes); // Use card routes
router.use('/cards/ygopro', ygoproRoutes); // Use card routes
router.use('/stripe', stripeRoutes);
router.use('/scrape', tcgScraperRoutes);

module.exports = router;
