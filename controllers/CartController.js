const Cart = require('../models/Cart');
const User = require('../models/User');

exports.getUserCart = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('cart');
    if (!user || !user.cart) {
      const newCart = new Cart({ userId, totalPrice: 0, quantity: 0, cart: [] });
      await newCart.save();
      user.cart = newCart._id;
      await user.save();
    } else {
      res.status(200).json(user.cart);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.updateCart = async (req, res, next) => {
  const { userId, cartItems } = req.body;

  if (!Array.isArray(cartItems)) {
    return res.status(400).json({ error: 'Cart must be an array' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let currentCart = await Cart.findById(user.cart);
    if (!currentCart) {
      currentCart = new Cart({ userId: user._id, cart: [] });
    }

    let updatedCart = [...currentCart.cart];

    for (let item of cartItems) {
      const { id, quantity: newQuantity } = item;

      const existingItemIndex = updatedCart.findIndex(
        (cartItem) => cartItem.id.toString() === id.toString(),
      );

      // If the item already exists in the cart, update the quantity
      if (existingItemIndex > -1) {
        // If the new quantity is 0, remove the item from the cart
        if (newQuantity === 0) {
          updatedCart.splice(existingItemIndex, 1);
        } else {
          // Otherwise, update the quantity
          updatedCart[existingItemIndex].quantity = newQuantity;
          console.log('New value for existing item', updatedCart[existingItemIndex]);
        }
      } else if (newQuantity > 0) {
        updatedCart.push(item);
      }
    }

    currentCart.cart = updatedCart;

    await currentCart.save();

    await user.save();
    // Update the user's cart reference if necessary
    if (!user.cart) {
      user.cart = currentCart._id;
      await user.save();
    }

    res.json(currentCart);
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: 'Server error' });
    next(error);
  }
};

// Create Empty Cart
exports.createEmptyCart = async (req, res, next) => {
  const { userId } = req.body;

  try {
    // Check if a cart for the user already exists
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create a new cart if none exists
      cart = new Cart({
        userId,
        cart: [],
      });
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error specifically
      res.status(409).json({ error: 'A cart for this user already exists.' });
    } else {
      console.error(error);
      next(error);
    }
  }
};
