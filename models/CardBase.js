const mongoose = require('mongoose');
const { Schema } = mongoose;

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
const CardSetsSchema = new Schema({
  id: {
    type: Number,
    // required: true,
  },
  image_url: {
    type: String,
    // required: true,
  },
});

const CardPriceSchema = new Schema({
  tcgplayer_price: {
    type: Number,
    required: true,
  },
});

const CardBaseSchema = new mongoose.Schema({
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
  desc: String,
  atk: Number,
  def: Number,
  level: Number,
  race: String,
  attribute: String,
  archetype: [String],
  image: String,
  card_sets: [CardSetsSchema],
  card_images: [CardImageSchema],
  card_prices: [CardPriceSchema],
});

module.exports = mongoose.model('CardBase', CardBaseSchema);
// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const CardImageSchema = new Schema({
//   id: Number,
//   image_url: String,
//   image_url_small: String,
//   image_url_cropped: String,
// });

// const CardPriceSchema = new Schema({
//   amazon_price: String,
//   cardmarket_price: String,
//   coolstuffinc_price: String,
//   ebay_price: String,
//   tcgplayer_price: String,
// });

// const CardSetSchema = new Schema({
//   set_name: String,
//   set_code: String,
//   set_rarity: String,
//   set_rarity_code: String,
//   set_price: String,
// });

// const CardBaseSchema = new mongoose.Schema({
//   id: {
//     type: Number,
//     required: true,
//   },
//   name: {
//     type: String,
//     required: true,
//   },
//   type: String,
//   frameType: String,
//   desc: String,
//   atk: Number,
//   def: Number,
//   level: Number,
//   race: String,
//   attribute: String,
//   archetype: String,
//   card_images: [CardImageSchema],
//   card_sets: [CardSetSchema],
//   card_prices: [CardPriceSchema],
//   quantity: {
//     type: Number,
//     default: 0,
//   },
//   price: {
//     type: Number,
//     default: 0,
//   },
// });

// module.exports = mongoose.model('CardBase', CardBaseSchema);
