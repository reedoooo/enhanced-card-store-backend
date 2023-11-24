const mongoose = require('mongoose');
const { Schema } = mongoose;
const CardBaseSchema = require('./CardBase').schema;

const CardInDeckSchema = new Schema({
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
// const CardInDeckSchema = new Schema({
//   ...CardBaseSchema.obj,
//   name: {
//     type: String,
//     required: true,
//   },
//   id: { type: String, required: true },
//   quantity: {
//     type: Number,
//     // required: true,
//   },
// });
const deckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  totalPrice: {
    type: Number,
  },
  cards: [CardInDeckSchema],
});

module.exports = mongoose.model('Deck', deckSchema);
