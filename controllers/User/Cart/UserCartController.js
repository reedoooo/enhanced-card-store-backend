// !--------------------------! CARTS !--------------------------!
const { CardInCart } = require('../../../models/Card');
const { Cart } = require('../../../models/Collection');
const User = require('../../../models/User');
const { populateUserDataByContext } = require('../dataUtils');

exports.getUserCart = async (req, res, next) => {
  const { userId } = req.params;

  try {
    let user = await populateUserDataByContext(userId, ['cart']);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.cart) {
      const newCart = new Cart({ userId: userId, totalPrice: 0, totalQuantity: 0, cards: [] });
      await newCart.save();
      user.cart = newCart._id;
      await user.save();

      user = await populateUserDataByContext(userId, ['cart']);
    }

    return res.status(200).json(user.cart);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
exports.createEmptyCart = async (req, res, next) => {
  const { userId } = req.params;

  try {
    let user = await populateUserDataByContext(userId, ['cart']);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.cart) {
      return res.status(409).json({ error: 'A cart for this user already exists.' });
    }

    const newCart = new Cart({ userId: userId, totalPrice: 0, totalQuantity: 0, cards: [] });
    await newCart.save();
    user.cart = newCart._id;
    await user.save();

    user = await populateUserDataByContext(userId, ['cart']);
    return res.status(201).json({ message: 'Cart created', data: user.cart });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
exports.updateCart = async (req, res, next) => {
  const { userId, cart, method } = req.body;

  if (!Array.isArray(cart)) {
    return res.status(400).json({ error: 'Cart must be an array' });
  }

  try {
    let user = await populateUserDataByContext(userId, ['cart']);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    switch (method) {
      case 'POST':
        await addToCart(user, cart);
        break;
      case 'DELETE':
        await removeFromCart(user, cart);
        break;
      case 'PUT':
        await updateCartItems(user, cart);
        break;
      default:
        return res.status(400).json({ error: 'Invalid method for updating cart' });
    }

    await user.save();

    user = await populateUserDataByContext(userId, ['cart']);
    res.status(200).json({ message: 'Cart updated', data: user.cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper functions for different methods
async function addToCart(user, cartItems) {
  for (const item of cartItems) {
    const existingItem = user.cart.cart.find((ci) => ci.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      user.cart.cart.push(item);
    }

    let cardInCart = await CardInCart.findOne({ cardId: item.id, userId: user._id });
    if (cardInCart) {
      cardInCart.quantity += item.quantity;
    } else {
      cardInCart = new CardInCart({ ...item, userId: user._id });
    }
    await cardInCart.save();
  }
}

async function removeFromCart(user, cartItems) {
  user.cart.cart = user.cart.cart.filter((ci) => !cartItems.some((item) => item.id === ci.id));
  for (const item of cartItems) {
    await CardInCart.findOneAndRemove({ cardId: item.id, userId: user._id });
  }
}

async function updateCartItems(user, cartItems) {
  for (const item of cartItems) {
    const cartItemIndex = user.cart.cart.findIndex((ci) => ci.id === item.id);
    if (cartItemIndex > -1) {
      const cartItem = user.cart.cart[cartItemIndex];
      if (item.quantity > 0) {
        cartItem.quantity = item.quantity;
      } else {
        user.cart.cart.splice(cartItemIndex, 1);
      }

      let cardInCart = await CardInCart.findOne({ cardId: item.id, userId: user._id });
      if (cardInCart) {
        if (item.quantity > 0) {
          cardInCart.quantity = item.quantity;
          await cardInCart.save();
        } else {
          await CardInCart.findOneAndRemove({ cardId: item.id, userId: user._id });
        }
      }
    }
  }
}
// !--------------------------! CARTS !--------------------------!
