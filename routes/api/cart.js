const express = require('express');
const cartController = require('../../controllers/CartController');

const router = express.Router();

router.get('/:cartId', cartController.getCart); // Route changed to /:cartId
router.get('/userCart/:userId', cartController.getUserCart);
router.put('/:cartId', cartController.updateCart); 
router.put('/:cartId/decrease', cartController.decreaseItemQuantity); // new route for decreasing item quantity
router.delete('/user/:userId/cart/:cartId', cartController.deleteItemFromCart); // Changed :id to :cartId for consistency
router.get('/', cartController.getAllCarts);

router.post('/', cartController.createOrUpdateCart); // Route changed to / and user id is passed in the body
router.post('/newCart/:userId', cartController.createEmptyCart);

module.exports = router;
