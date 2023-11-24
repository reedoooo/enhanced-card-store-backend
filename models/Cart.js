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
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
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

module.exports = mongoose.model('Cart', CartSchema);
