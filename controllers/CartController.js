const Cart = require('../models/Cart.js');

exports.getUserCart = async (req, res) => {
  const { userId } = req.params;

  try {
    let userCart = await Cart.findOne({ userId });

    if (!userCart) {
      userCart = new Cart({
        userId,
        totalPrice: 0,
        quantity: 0,
        cart: [],
      });
      await userCart.save();
    }

    res.status(200).json(userCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
};

exports.updateCart = async (req, res) => {
  const cartItems = req.body.cart; // Assuming cart items are nested inside a 'cart' field in the body.

  if (!Array.isArray(cartItems)) {
    return res.status(400).json({ error: 'Cart must be an array' });
  }

  try {
    let currentCart = await Cart.findById(req.params.cartId);

    if (currentCart) {
      let updatedCart = [...currentCart.cart];

      for (let item of cartItems) {
        const { id, quantity: newQuantity } = item;

        const existingItem = updatedCart.find(
          (cartItem) => cartItem.id.toString() === id.toString(),
        );

        if (existingItem) {
          if (newQuantity === 0) {
            updatedCart = updatedCart.filter(
              (cartItem) => cartItem.id.toString() !== id.toString(),
            );
          } else {
            existingItem.quantity = newQuantity;
          }
        } else if (newQuantity > 0) {
          updatedCart.push(item);
        }
      }

      // Update the cart
      currentCart.cart = updatedCart;

      await currentCart.save();
      res.json(currentCart);
    } else {
      res.status(404).json({ error: 'Cart not found.' });
    }
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createEmptyCart = async (req, res) => {
  const { userId } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        cart: [],
      });

      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
