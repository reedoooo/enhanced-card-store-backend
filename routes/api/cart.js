const express = require('express');
const rateLimit = require('express-rate-limit');
const cartController = require('../../controllers/CartController');

const router = express.Router();

// Define rate limit options (adjust as needed)
const rateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max requests per windowMs
  message: 'Too many requests, please try again later.',
};

// Apply rate limiting middleware to all routes
const limiter = rateLimit(rateLimitOptions);
router.use(limiter);

// get cart by user id
router.get('/userCart/:userId', cartController.getUserCart);

// new cart
router.post('/:userId/newCart', cartController.createEmptyCart);

// update cart by cart id
router.put('/:cartId/update', cartController.updateCart);

// router.get('/:cartId', cartController.getCart); // Route changed to /:cartId
// router.put('/:cartId/decrease', cartController.decreaseItemQuantity); // new route for decreasing item quantity
// router.delete('/user/:userId/cart/:cartId', cartController.deleteItemFromCart); // Changed :id to :cartId for consistency
// router.get('/', cartController.getAllCarts);

// router.post('/newCart', cartController.createOrUpdateCart); // Route changed to / and user id is passed in the body
// router.post('/newCart/:userId', cartController.createEmptyCart);

module.exports = router;
