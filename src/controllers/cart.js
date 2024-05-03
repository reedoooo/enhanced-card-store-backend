// !--------------------------! CARTS !--------------------------!
const logger = require('../configs/winston');
const { CardInCart } = require('../models/Card');
const { Cart } = require('../models/Collection');
const { populateUserDataByContext } = require('./utils/dataUtils');
const { reFetchForSave } = require('./utils/helpers');
async function removeFromCart(user, cartItems) {
  for (const item of cartItems) {
    await CardInCart.findOneAndRemove({ cardId: item.id, userId: user._id });
  }
  // Filter the cart to remove the deleted items
  user.cart.items = user.cart.items.filter(
    (cardInCartId) => !cartItems.some((item) => item.id === cardInCartId),
  );
}
const updateCardQuantity = (card, quantity, type, user) => {
  if (type === 'increment') {
    card.quantity += 1;
  } else if (type === 'decrement' && card.quantity > 1) {
    card.quantity -= 1;
  } else if ((type === 'decrement' && card.quantity === 1) || type === 'delete') {
    removeFromCart(user, card._id);
  }
};
exports.getUserCart = async (req, res, next) => {
  const { userId } = req.params;

  try {
    let user = await populateUserDataByContext(userId, ['cart']);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.cart) {
      const newCart = new Cart({
        userId: userId,
        totalPrice: 0,
        totalQuantity: 0,
        cards: [],
      });
      await newCart.save();
      user.cart = newCart._id;
      await user.save();
    }
    user = await populateUserDataByContext(userId, ['cart']);

    return res.status(200).json({ message: 'Cart retrieved', data: user.cart });
  } catch (error) {
    logger.error('Error getting user cart:', { error });
    next(error);
  }
};
exports.createEmptyCart = async (req, res, next) => {
  const { userId } = req.params;

  let user = await populateUserDataByContext(userId, ['cart']);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.cart) {
    return res.status(409).json({ error: 'A cart for this user already exists.' });
  }

  const newCart = new Cart({
    userId: userId,
    totalPrice: 0,
    totalQuantity: 0,
    cards: [],
  });
  await newCart.save();
  user.cart = newCart._id;
  await user.save();

  user = await populateUserDataByContext(userId, ['cart']);
  return res.status(201).json({ message: 'Cart created', data: user.cart });
};
exports.removeCardsFromCart = async (req, res, next) => {
  const { userId } = req.params;
  const { cards, type } = req.body;

  try {
    const user = await populateUserDataByContext(userId, ['cart']);
    for (const cardId of cards) {
      // updateCardQuantity(existingCard, card.quantity, type, populatedUser);
      const existingCardIndex = user.cart.items.findIndex((c) => c.id === cardId);
      if (existingCardIndex !== -1) {
        const existingCard = user.cart.items[existingCardIndex];
        updateCardQuantity(existingCard, existingCard.quantity, type, populatedUser);
      }
    }
    res.status(200).json({ message: 'Cards removed from cart', data: user.cart });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};
exports.addCardsToCart = async (req, res, next) => {
  const { cards, type } = req.body; // Assuming cartUpdates contains the updates for the cart
  const cardsArray = Array.isArray(cards) ? cards : [cards];
  const populatedUser = await populateUserDataByContext(req.params.userId, ['cart']);
  // Check if the user exists
  if (!populatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if the user has a cart, if not, create a new one
  if (!populatedUser.cart) {
    const newCart = new Cart({
      userId: populatedUser._id,
      totalPrice: 0,
      totalQuantity: 0,
      items: [],
    });
    await newCart.save();
    populatedUser.cart = newCart;
  }
  let { cart } = populatedUser; // Using let since we might modify the cart
  logger.info('cart', cart);
  for (const card of cardsArray) {
    logger.info('CART ITEM TO UPDATE: ' + `${card.name}`.yellow);
    const existingCardIndex = cart.items.findIndex((c) => c.id === card.id);
    if (existingCardIndex !== -1) {
      const existingCard = cart.items[existingCardIndex];
      updateCardQuantity(existingCard, card.quantity, type, populatedUser);
    } else {
      const reSavedCard = await reFetchForSave(card, cart?._id, 'Cart', 'CardInCart'); // Assuming this function is correctly implemented
      cart?.items?.push(reSavedCard?._id);
    }
  }
  await cart.save();
  await populatedUser.save(); // Saving after all updates to cart
  await populatedUser.populate({
    path: 'cart.items',
    model: 'CardInCart',
  });

  res.status(200).json({
    message: 'Cart updated successfully.',
    data: populatedUser.cart,
  });
};
exports.deleteCardFromCart = async (req, res, next) => {
  const { userId, cardId } = req.params;
  try {
    const user = await populateUserDataByContext(userId, ['cart']);
    const cart = user?.cart;

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    const cardInCart = cart.items.find((item) => item._id.toString() === cardId);

    if (!cardInCart) {
      return res.status(404).json({ message: 'Card not found in cart.' });
    }
    // FIND AND DELETE
    await CardInCart.findByIdAndDelete(cardInCart._id);
    // FIND AND REMOVE FROM CART
    cart.items = cart.items.filter((item) => item.id.toString() !== cardId);
    // SAVE CHANGES
    await cart.save();
    await user.save();

    res.status(200).json({ message: 'Card removed from cart successfully.', data: cart });
  } catch (error) {
    logger.error('Error deleting card from cart:', error);
    next(error);
  }
};

// !--------------------------! CARTS !--------------------------!
