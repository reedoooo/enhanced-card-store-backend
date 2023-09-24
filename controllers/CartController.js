const Cart = require('../models/Cart.js');

exports.getUserCart = async (req, res) => {
  const { userId } = req.params;

  try {
    let userCart = await Cart.findOne({ userId: userId });

    if (!userCart) {
      userCart = new Cart({
        userId: userId,
        totalPrice: 0,
        quantity: 0,
        cart: [],
      });
      await userCart.save();
    }

    // console.log('userCart', userCart);

    res.status(200).json(userCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
};

// const rateLimitedUpdateCart = () => {
//   let lastCalled = 0;
//   return (...args) => {
//     const now = Date.now();
//     if (now - lastCalled > 1000) { // 1000 milliseconds
//       lastCalled = now;
//       updateCart(...args);
//     }
//   };
// };

exports.updateCart = async (req, res) => {
  const cart = req.body;

  // console.log('cart', cart);

  if (!Array.isArray(cart)) {
    return res.status(400).json({ error: 'Cart must be an array' });
  }
  try {
    let currentCart = await Cart.findById(req.params.cartId);
    // console.log('currentCart', currentCart);

    if (currentCart) {
      // Create a copy of the current cart
      let updatedCart = [...currentCart.cart];

      for (let item of cart) {
        const { id } = item;
        const quantity = parseInt(item.quantity);

        const itemIndex = updatedCart.findIndex(
          (cartItem) => cartItem.id.toString() === id.toString(),
        );

        if (itemIndex > -1) {
          if (item.quantity === 0) {
            updatedCart.splice(itemIndex, 1);
          } else {
            updatedCart[itemIndex].quantity = item.quantity;
          }
        } else if (quantity > 0) {
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
  const { userId } = req.body; // Extracting userId from body instead of params

  try {
    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      cart = new Cart({
        userId: userId,
        cart: [],
      });

      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// exports.getCart = async (req, res) => {
//   const cart = await Cart.findById(req.params.cartId);
//   res.json(cart);
// };

// exports.getAllCarts = async (req, res) => {
//   const carts = await Cart.find();
//   res.json(carts);
// };

// exports.deleteItemFromCart = async (req, res) => {
//   let cart = await Cart.findById(req.params.cartId);

//   if (cart) {
//     cart.cart = cart.cart.filter(
//       (item) => item.cardId.toString() !== req.params.cardId, // Changed from cartId to cardId
//     );

//     await cart.save();
//     res.json(cart);
//   } else {
//     res.status(404).json({ error: 'Cart not found.' });
//   }
// };

// exports.decreaseItemQuantity = async (req, res) => {
//   console.log('req.body', req.body);

//   const { cartId } = req.params; // changed to req.params
//   const { cardId, cartData } = req.body;
//   // console.log('cartData', cartData);
//   console.log('cartId', cartId);
//   const id = cartData._id;
//   try {
//     let cart = await Cart.findOne({ _id: id });
//     console.log('cart', cart);
//     if (cart) {
//       let existingCartItem = cart.cart.find((item) => item.id.toString() === cardId);

//       if (existingCartItem && existingCartItem.quantity > 0) {
//         existingCartItem.quantity -= 1;
//         if (existingCartItem.quantity === 0) {
//           cart.cart = cart.cart.filter((item) => item.id.toString() !== cardId);
//         }
//       }

//       await cart.save();
//       res.json(cart);
//     } else {
//       res.status(404).json({ error: 'Cart not found.' });
//     }
//   } catch (error) {
//     console.error(error.stack);
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.createCart = async (req, res) => {
//   const { userId } = req.body;

//   try {
//     // Check if a cart with the same userId already exists
//     const existingCart = await Cart.findOne({ userId: userId });

//     if (existingCart) {
//       return res.status(400).json({ error: 'Cart already exists for this user.' });
//     }

//     // If no cart exists, create a new one
//     const cart = new Cart({
//       userId: userId,
//       cart: [],
//     });

//     await cart.save();
//     res.json(cart);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
