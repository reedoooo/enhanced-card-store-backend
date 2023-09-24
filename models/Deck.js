const mongoose = require('mongoose');
const { Schema } = mongoose;
// const cardSchema = new mongoose.Schema({
//   id: String,
//   name: String,
//   type: String,
//   frameType: String,
//   description: String,
//   card_images: [String],
//   archetype: String,
//   atk: Number,
//   def: Number,
//   level: Number,
//   race: String,
//   attribute: String,
//   quantity: Number,
// });

const CardImageSchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
});

const CardPriceSchema = new Schema({
  tcgplayer_price: {
    type: Number,
    required: true,
  },
});
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
  card_images: [CardImageSchema],
  archetype: [String],
  atk: Number,
  def: Number,
  level: Number,
  race: String,
  attribute: String,
  card_prices: [CardPriceSchema],
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

// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const CardImageSchema = new Schema({
//   id: {
//     type: Number,
//     required: true,
//   },
//   image_url: {
//     type: String,
//     required: true,
//   },
// });

// const CardPriceSchema = new Schema({
//   tcgplayer_price: {
//     type: Number,
//     required: true,
//   },
// });

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

// const DeckSchema = new Schema({
//   userId: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     // unique: true,
//   },
//   cards: [CardInDeckSchema],
// });

// module.exports = mongoose.model('Deck', DeckSchema);
