const mongoose = require('mongoose');
const { Schema } = mongoose;
// const CardInDeckSchema = new Schema({
//   id: {
//     // type: Number,
//     type: String,
//     required: true,
//     // unique: true,
//   },
//   name: {
//     type: String,
//     required: true,
//   },
//   type: String,
//   frameType: String,
//   description: String,
//   card_images: [CardImageSchema],
//   archetype: [String],
//   atk: Number,
//   def: Number,
//   level: Number,
//   race: String,
//   attribute: String,
//   card_prices: [CardPriceSchema],
//   quantity: {
//     type: Number,
//     // required: true,
//   },
// });
const CardInDeckSchema = new Schema({
  card: { type: Schema.Types.ObjectId, ref: 'CardBase' },
  cardId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
    sparse: true,
  },
  quantity: {
    type: Number,
    // required: true,
  },
});
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
