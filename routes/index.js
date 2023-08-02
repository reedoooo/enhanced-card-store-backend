const express = require('express');
const router = express.Router();

const userRoutes = require('./api/user');
const orderRoutes = require('./api/order');
const productRoutes = require('./api/product');
const cartRoutes = require('./api/cart');
const cardRoutes = require('./api/card'); // Import card routes
const ygoproRoutes = require('./api/ygopro'); // Import card routes
const deckRoutes = require('./api/deck'); // Import card routes

router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/carts', cartRoutes);
router.use('/cards', cardRoutes); // Use card routes
router.use('/decks', deckRoutes); // Use card routes
router.use('/cards/ygopro', ygoproRoutes); // Use card routes
// router.use('/carts/userCart/:userId', cartRoutes); // Use card routes

module.exports = router;
// const express = require('express');
// const router = express.Router();

// const userRoutes = require('./api/user');
// const orderRoutes = require('./api/order');
// const productRoutes = require('./api/product');
// const cartRoutes = require('./api/cart');
// const cardRoutes = require('./api/card'); // Import card routes

// module.exports = (redisClient) => {
//   // Expect redisClient here
//   router.use('/orders', orderRoutes(redisClient)); // And pass it to the individual routes
//   router.use('/users', userRoutes(redisClient));
//   router.use('/products', productRoutes(redisClient));
//   router.use('/carts', cartRoutes(redisClient));
//   router.use('/cards', cardRoutes(redisClient)); // Use card routes

//   return router;
// };
