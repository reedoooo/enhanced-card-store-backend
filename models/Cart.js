const mongoose = require('mongoose');
const { Schema } = mongoose;

const CardInCartSchema = new Schema({
  id: {
    type: String,
    required: true,
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

module.exports = mongoose.model('Cart', CartSchema);
