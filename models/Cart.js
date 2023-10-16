const mongoose = require('mongoose');
const { Schema } = mongoose;

const CardInCartSchema = new Schema({
  card: { type: Schema.Types.ObjectId, ref: 'CardBase' },
  cardId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
    sparse: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
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
