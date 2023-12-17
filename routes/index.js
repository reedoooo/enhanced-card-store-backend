const express = require('express');
const router = express.Router();

const userRoutes = require('./api/user');
// const orderRoutes = require('./api/order');
// const productRoutes = require('./api/product');
// const cartRoutes = require('./api/cart');
const cardRoutes = require('./api/card');
// const ygoproRoutes = require('./api/ygopro');
// const stripeRoutes = require('./other/stripe');
const cardImageRoutes = require('./api/cardimage');

router.use('/users', userRoutes);
// router.use('/carts', cartRoutes);
router.use('/cards', cardRoutes);
// router.use('/cards/ygopro', ygoproRoutes);
// router.use('/stripe', stripeRoutes);
// router.use('/scrape', tcgScraperRoutes);
router.use('/card-image', cardImageRoutes);

// router.use('/directedResponses', directedResponsesRoutes);
// router.use('/chart-data', cronRoutes);
// router.use('/cron', cronRoutes);

module.exports = router;
