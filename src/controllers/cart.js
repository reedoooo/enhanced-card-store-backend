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
const updateCardQuantity = (card, quantity, type) => {
  if (type === 'increment') {
    card.quantity += 1;
  } else if (type === 'decrement' && card.quantity > 1) {
    card.quantity -= 1;
  } else if (type === 'decrement' && card.quantity === 1) {
    card.quantity = 0;
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
  const { userId, cartId } = req.params;
  const { cards, type } = req.body;

  try {
    let user = await populateUserDataByContext(userId, ['cart']);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.cart) {
      return res.status(404).json({ error: 'User does not have a cart' });
    }

    await removeFromCart(user, cards);

    user = await populateUserDataByContext(userId, ['cart']);
    res.status(200).json({ message: 'Cards removed from cart', data: user.cart });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};
exports.addCardsToCart = async (req, res, next) => {
  const { items, type } = req.body; // Assuming cartUpdates contains the updates for the cart
  // logger.info('cartUpdates', cartUpdates);

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Cart updates must be an array' });
  }

  const populatedUser = await populateUserDataByContext(req.params.userId, ['cart']);
  if (!populatedUser || !populatedUser.cart) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  let { cart } = populatedUser; // Using let since we might modify the cart
  logger.info('cart', cart);
  for (const update of items) {
    logger.info('CART ITEM TO UPDATE: ' + `${update.name}`.yellow);
    const existingCardIndex = cart.items.findIndex((c) => c.id === update.id);
    if (existingCardIndex !== -1) {
      const existingCard = cart.items[existingCardIndex];
      updateCardQuantity(existingCard, update.quantity, type); // Assume this is your logic to update quantity
    } else {
      const reSavedCard = await reFetchForSave(update, cart?._id, 'Cart', 'CardInCart'); // Assuming this function is correctly implemented
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
exports.updateCardsInCart = async (req, res, next) => {
  const { cartId } = req.params;
  const { userId, cartUpdates, method, type } = req.body;

  if (!Array.isArray(cartUpdates)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array.' });
  }

  try {
    const populatedUser = await populateUserDataByContext(userId, ['cart']);
    const cart = populatedUser?.cart; // Assuming a user has a single cart referenced directly

    if (!cart || cart._id.toString() !== cartId) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    for (const cardData of cart) {
      const cardInCart = cart?.cart?.find((item) => item._id.toString() === cardData?._id);

      if (cardInCart) {
        logger.info('Updating existing card in cart:', cardInCart.name.blue);
        // Adjust the card's quantity in the cart
        if (type === 'increment') {
          cardInCart.quantity += 1;
        } else if (type === 'decrement' && cardInCart.quantity > 1) {
          cardInCart.quantity -= 1;
        } else if (type === 'decrement' && cardInCart.quantity === 1) {
          // Remove the card from the cart if the quantity becomes 0
          const index = cart.items.indexOf(cardInCart);
          if (index > -1) {
            cart.items.splice(index, 1);
          }
        } else if (type === 'update' && cardData.quantity) {
          // Update directly to a specific quantity
          cardInCart.quantity = cardData.quantity;
        }
        logger.info('Card quantity in cart:', cardInCart.quantity);
      } else {
        logger.info(`Card not found in cart: ${cardData._id}`);
      }
    }

    await cart.save(); // Assuming 'cart' is a document that can be saved directly
    await populatedUser.save(); // Save changes to the user document as well

    // Optionally, repopulate the cart items if necessary for the response
    // await cart.populate({
    //   path: "cart",
    //   model: "CardInCart",
    // });

    res.status(200).json({ message: 'Cards updated in cart successfully.', data: cart });
  } catch (error) {
    logger.error('Error updating cards in cart:', error);
    next(error);
  }
};

// !--------------------------! CARTS !--------------------------!
