// !--------------------------! CARTS !--------------------------!
const { CardInCart } = require('../models/Card');
const { Cart } = require('../models/Collection');
// const User = require("../../../src/models/User");
const { populateUserDataByContext } = require('./dataUtils');
const { reFetchForSave } = require('./User/helpers');
async function addToCart(user, cartItems) {
  for (const item of cartItems) {
    console.log('item', item);
    console.log('itcartItems', cartItems);
    const cardInCart = await CardInCart.findOne({
      cardId: item.id,
      userId: user._id,
    });
    if (cardInCart) {
      console.log('Incrementing card:', cardInCart.name.blue);

      cardInCart.quantity += item.quantity;

      await cardInCart.save();
    } else {
      const cartCard = new CardInCart({
        cardId: item.id,
        userId: user._id,
        quantity: item.quantity,
      });
      console.log('Adding card:', cartCard?.name?.blue);

      await cartCard.save();

      user.cart.items.push(cartCard?._id);

      await user.save();

      user = await populateUserDataByContext(user._id, ['cart']);
    }
  }

  return { updatedCart: user.cart };
}
async function removeFromCart(user, cartItems) {
  for (const item of cartItems) {
    await CardInCart.findOneAndRemove({ cardId: item.id, userId: user._id });
  }
  // Filter the cart to remove the deleted items
  user.cart.items = user.cart.items.filter(
    (cardInCartId) => !cartItems.some((item) => item.id === cardInCartId),
  );
}
async function updateCartItems(user, cartItems, type) {
  if (type === 'addNew') {
    return addToCart(user, cartItems);
  }
  for (const item of cartItems) {
    let cardInCart = await CardInCart.findOne({
      cardId: item?.id,
      userId: user?._id,
    });
    if (cardInCart) {
      console.log('Incrementing existing card:', cardInCart.name.blue);

      if (cardInCart.quantity !== item.quantity) {
        console.log('Updating card quantity');
        cardInCart.quantity = item.quantity;
      }
      if (cardInCart.quantity === item.quantity && type === 'increment') {
        console.log('Incrementing card quantity');
        cardInCart.quantity += 1;
      }
      if (cardInCart.quantity === item.quantity && type === 'decrement') {
        console.log('Decrementing card quantity');
        cardInCart.quantity -= 1;
      }
      await cardInCart.save();
    }
    if (type === 'remove') {
      console.log('Decrementing existing card:', cardInCart?.name?.blue, 'by', cardInCart);

      await CardInCart.findOneAndRemove({ cardId: item.id, userId: user._id });
      // Remove from user's cart
      user.cart.items = user.cart.items.filter(
        (cartItem) => cartItem.toString() !== cardInCart?._id.toString(),
      );
    }
  }

  // SAVE CART TO CART COLLECTION
  await user.cart.save();

  user = await populateUserDataByContext(user._id, ['cart']);

  return { updatedCart: user.cart };
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
    console.error('Error getting user cart:', { error });
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
  } catch (error) {
    console.error(error);
    next(error);
  }
};
exports.addCardsToCart = async (req, res, next) => {
  const { cartId } = req.params;
  const { userId, cart, method, type } = req.body;
  const cards = cart;
  try {
    let user = await populateUserDataByContext(userId, ['cart']);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.cart) {
      return res.status(404).json({ error: 'User does not have a cart' });
    }

    user = await addToCart(user, cards);

    user = await populateUserDataByContext(userId, ['cart']);
    res.status(200).json({ message: 'Cards added to cart', data: user?.cart });
  } catch (error) {
    console.error(error);
    next(error);
  }
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
    console.error(error);
    next(error);
  }
};
exports.addCardsToCart = async (req, res, next) => {
  const { userId, cartUpdates, method, type } = req.body; // Assuming cartUpdates contains the updates for the cart
  // console.log('cartUpdates', cartUpdates);
  console.log('method', method);
  console.log('type', type);

  if (!Array.isArray(cartUpdates)) {
    return res.status(400).json({ error: 'Cart updates must be an array' });
  }

  try {
    const populatedUser = await populateUserDataByContext(userId, ['cart']);
    if (!populatedUser || !populatedUser.cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    let { cart } = populatedUser; // Using let since we might modify the cart
    console.log('cart', cart);
    for (const update of cartUpdates) {
      console.log('update', update);
      console.log('cartUpdatescartUpdatescartUpdates', cartUpdates);
      const existingCardIndex = cart.items.findIndex((c) => c.id === update.id);
      if (existingCardIndex !== -1) {
        // Card exists, so update it
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
  } catch (error) {
    console.error('Error updating cart:', error);
    next(error);
  }
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
        console.log('Updating existing card in cart:', cardInCart.name.blue);
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
        console.log('Card quantity in cart:', cardInCart.quantity);
      } else {
        console.log(`Card not found in cart: ${cardData._id}`);
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
    console.error('Error updating cards in cart:', error);
    next(error);
  }
};

// !--------------------------! CARTS !--------------------------!
