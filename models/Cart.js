const mongoose = require('mongoose');
const { Schema } = mongoose;

// const CardInCartSchema = new Schema({
//   card: { type: Schema.Types.ObjectId, ref: 'CardBase' },
//   // id: {
//   //   type: Schema.Types.ObjectId,
//   //   required: true,
//   //   unique: true,
//   //   sparse: true,
//   // },
//   id: Number, // Assuming id is a number as per your data
//   quantity: {
//     type: Number,
//     required: true,
//   },
// });
const CardInCartSchema = new Schema({
  id: {
    // type: Number,
    type: String,
    required: true,
    // unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: String,
  frameType: String,
  description: String,
  archetype: [String],
  atk: Number,
  def: Number,
  level: Number,
  race: String,
  attribute: String,
  card_images: [
    {
      id: Number,
      image_url: String,
    },
  ],
  card_prices: [
    {
      tcgplayer_price: Number,
    },
  ],
  quantity: {
    type: Number,
    // required: true,
  },
  price: { type: Number, required: false },
});
const CartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  totalPrice: {
    type: Number,
    default: 0,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  cart: [CardInCartSchema],
});

// CartSchema.methods.updateCartItems = function (cartItems) {
//   // console.log('updateCartItems data...');
//   // console.log('cartItems: ', cartItems);
//   // console.log('this.cart: ', this.cart);
//   // console.log('this.cart.length: ', this.cart.length);

//   // Loop through the cart items
//   cartItems.forEach((cartItem) => {
//     // console.log('cartItem: ', cartItem);
//     // console.log('cartItem.id: ', cartItem.id);
//     // console.log('cartItem.quantity: ', cartItem.quantity);

//     // Find the matching card in the cart
//     const existingCartItem = this.cart.find((cartItem) => cartItem.id === cartItem.id);

//     // If the card is already in the cart, update the quantity
//     if (existingCartItem) {
//       existingCartItem.quantity = cartItem.quantity;
//     } else {
//       // Otherwise, add the card to the cart
//       this.cart.push(cartItem);
//     }
//   });

//   // Update the cart total price and quantity
//   this.totalPrice = this.cart.reduce(
//     (total, cartItem) => total + cartItem.price * cartItem.quantity,
//     0,
//   );
//   this.quantity = this.cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
// };

module.exports = mongoose.model('Cart', CartSchema);
