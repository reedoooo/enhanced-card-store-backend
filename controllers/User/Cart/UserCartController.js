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
async function addToCart(user, cartItems) {
  for (const item of cartItems) {
    let cardInCart = await CardInCart.findOne({ cardId: item.id, userId: user._id });
    if (cardInCart) {
      cardInCart.quantity += item.quantity;
    } else {
      cardInCart = new CardInCart({ cardId: item.id, userId: user._id, quantity: item.quantity });
    }
    await cardInCart.save();
    // Add the reference of the CardInCart to the user's cart
    if (!user.cart.cart.includes(cardInCart._id)) {
      user.cart.cart.push(cardInCart._id);
    }
  }
}
async function removeFromCart(user, cartItems) {
  for (const item of cartItems) {
    await CardInCart.findOneAndRemove({ cardId: item.id, userId: user._id });
  }
  // Filter the cart to remove the deleted items
  user.cart.cart = user.cart.cart.filter(
    (cardInCartId) => !cartItems.some((item) => item.id === cardInCartId),
  );
}
async function updateCartItems(user, cartItems) {
  for (const item of cartItems) {
    let cardInCart = await CardInCart.findOne({ cardId: item.id, userId: user._id });
    if (cardInCart) {
      if (item.quantity > 0) {
        cardInCart.quantity = item.quantity;
        await cardInCart.save();
      } else {
        await CardInCart.findOneAndRemove({ cardId: item.id, userId: user._id });
        // Remove from user's cart
        user.cart.cart = user.cart.cart.filter(
          (cartItem) => cartItem.toString() !== cardInCart._id.toString(),
        );
      }
    }
  }
}

// !--------------------------! CARTS !--------------------------!
