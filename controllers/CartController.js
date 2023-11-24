const Cart = require('../models/Cart');
const User = require('../models/User');

// Get User Cart
// exports.getUserCart = async (req, res, next) => {
//   const { userId } = req.params;

//   try {
//     const user = await User.findById(userId).populate('cart');
//     console.log('user', user);
//     if (!user.cart) {
//       const newCart = new Cart({ userId, totalPrice: 0, quantity: 0, cart: [] });
//       await newCart.save();
//       user.cart = newCart._id;
//       await user.save();
//     }
//     res.status(200).json(user.cart);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//     next(error);
//   }
// };
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

// Update Cart
// exports.updateCart = async (req, res, next) => {
//   const { userId, cartItems } = req.body;

//   if (!Array.isArray(cartItems)) {
//     return res.status(400).json({ error: 'Cart must be an array' });
//   }

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Find the cart using the user's reference to it
//     let cart = await Cart.findById(user.cart);
//     if (!cart) {
//       console.log('Creating new cart for user');
//       cart = new Cart({ userId: user._id, cart: cartItems });
//     } else {
//       console.log('Updating existing cart');
//       cart.cart = cartItems; // Update the cart items
//     }

//     await cart.save();

//     await user.save();
//     // Optionally, if the user model holds a reference to the cart
//     // and if it's a new cart, update the user's reference to the new cart
//     if (!user.cart) {
//       user.cart = cart._id;
//       await user.save();
//     }

//     res.json(cart);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };
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

// const Cart = require('../models/Cart.js');
// const User = require('../models/User.js');

// exports.getUserCart = async (req, res, next) => {
//   const { userId } = req.params;

//   try {
//     let userCart = await Cart.findOne({ userId });

//     const user = await User.findById(userId).populate('cart');
//     if (!userCart) {
//       userCart = new Cart({
//         userId,
//         totalPrice: 0,
//         quantity: 0,
//         cart: [],
//       });
//       await userCart.save();
//     }

//     res.status(200).json(userCart);
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// };
// // Update Cart
// exports.updateCart = async (req, res, next) => {
//   const { cartId } = req.params;
//   const { cartItems } = req.body;

//   try {
//     const cart = await Cart.findByIdAndUpdate(
//       cartId,
//       {
//         $set: { cart: cartItems },
//       },
//       { new: true },
//     );

//     if (!cart) {
//       return res.status(404).json({ error: 'Cart not found' });
//     }

//     res.json(cart);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//     next(error);
//   }
// };
// exports.updateCart = async (req, res) => {
//   const cartItems = req.body.cart; // Assuming cart items are nested inside a 'cart' field in the body.
//   const updatedCartItems = [cartItems];
//   if (!Array.isArray(updatedCartItems)) {
//     return res.status(400).json({ error: 'Cart must be an array' });
//   }

//   try {
//     let currentCart = await Cart.findById(req.params.cartId);

//     if (currentCart) {
//       let updatedCart = [...currentCart.cart];

//       for (let item of updatedCartItems) {
//         const { id, quantity: newQuantity } = item;

//         const existingItem = updatedCart.find(
//           (cartItem) => cartItem.id.toString() === id.toString(),
//         );

//         if (existingItem) {
//           if (newQuantity === 0) {
//             updatedCart = updatedCart.filter(
//               (cartItem) => cartItem.id.toString() !== id.toString(),
//             );
//           } else {
//             existingItem.quantity = newQuantity;
//           }
//         } else if (newQuantity > 0) {
//           updatedCart.push(item);
//         }
//       }

//       currentCart.cart = updatedCart;

//       await currentCart.save();
//       res.json(currentCart);
//     } else {
//       res.status(404).json({ error: 'Cart not found.' });
//     }
//   } catch (error) {
//     console.error(error.stack);
//     res.status(500).json({ error: 'Server error' });
//   }
// };
// // exports.updateCart = async (req, res, next) => {
// //   const { cartId } = req.params;
// //   // const { userId, cart } = req.body;
// //   // console.log('cartItems', cart);
// //   // console.log('userId', userId);
// //   console.log('cartId', req.body.payload);
// //   const updatedItems = req.body.cartItems;
// //   const userId = req.body.userId;

// //   if (!Array.isArray(updatedItems)) {
// //     return res.status(400).json({ error: 'Cart must be an array' });
// //   }

// //   try {
// //     let currentCart = await Cart.findById(cartId);
// //     const user = await User.findById(userId).populate('cart');

// //     if (currentCart) {
// //       let updatedCart = [...currentCart.cart];
// //       // let updatedCart = [];

// //       for (let item of updatedItems) {
// //         // if (!item._id || typeof item._id !== 'string') {
// //         //   console.error('Invalid item ID:', item._id);
// //         //   continue; // Skip this item
// //         // }
// //         // const { _id, quantity: newQuantity } = item;
// //         const _id = item._id;
// //         const newQuantity = item.quantity;

// //         console.log('id', _id);
// //         console.log('newQuantity', newQuantity);
// //         console.log('item', item);

// //         // Check if _id is defined
// //         // if (!_id) {
// //         //   console.error('Item _id is undefined', item);
// //         //   continue; // Skip this iteration
// //         // }

// //         // const existingItem = updatedCart.find(
// //         //   (cartItem) => cartItem?._id.toString() === _id.toString(),
// //         // );
// //         const existingItem = updatedCart.find(
// //           (cartItem) => cartItem._id.toString() === item._id.toString(),
// //         );
// //         if (existingItem) {
// //           if (newQuantity === 0) {
// //             updatedCart = updatedCart.filter(
// //               (cartItem) => cartItem._id.toString() !== _id.toString(),
// //             );
// //           } else {
// //             existingItem.quantity = newQuantity;
// //           }
// //         } else if (newQuantity > 0) {
// //           updatedCart.push(item);
// //         }
// //       }

// //       // Update the cart
// //       currentCart.cart = updatedCart;

// //       await currentCart.save();

// //       await user.save();
// //       res.json(currentCart);
// //     } else {
// //       res.status(404).json({ error: 'Cart not found.' });
// //     }
// //   } catch (error) {
// //     console.error(error.stack);
// //     next(error);
// //   }
// // };

// exports.createEmptyCart = async (req, res, next) => {
//   // const { userId } = req.params;

//   const { userId } = req.body;

//   const user = await User.findById(userId).populate('cart');
//   try {
//     let cart = await Cart.findOne({ userId });

//     if (!cart) {
//       cart = new Cart({
//         userId,
//         cart: [],
//       });

//       await cart.save();

//       await user.save();
//     }

//     res.json(cart);
//   } catch (error) {
//     console.error(error.stack);
//     next(error);
//   }
// };
