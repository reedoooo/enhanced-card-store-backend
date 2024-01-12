// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// // Card Set Schema
// const cardSetSchema = new Schema({
//   set_name: String,
//   set_code: String,
//   set_rarity: String,
//   set_rarity_code: String,
//   set_price: mongoose.Types.Decimal128,
// });

// // Card Image Schema
// const cardImageSchema = new Schema({
//   id: Number,
//   image_url: String,
//   image_url_small: String,
//   image_url_cropped: String,
// });

// // Card Price Schema
// const cardPriceSchema = new Schema({
//   cardmarket_price: mongoose.Types.Decimal128,
//   tcgplayer_price: mongoose.Types.Decimal128,
//   ebay_price: mongoose.Types.Decimal128,
//   amazon_price: mongoose.Types.Decimal128,
//   coolstuffinc_price: mongoose.Types.Decimal128,
// });

// // Main Card Schema
// const cardSchema = new Schema({
//   id: Number,
//   name: String,
//   type: String,
//   frameType: String,
//   desc: String,
//   atk: Number,
//   def: Number,
//   level: Number,
//   race: String,
//   attribute: String,
//   card_sets: [cardSetSchema],
//   card_images: [cardImageSchema],
//   card_prices: [cardPriceSchema],
// });

// // Data Schema (Wrapper)
// const dataSchema = new Schema({
//   data: [cardSchema],
// });

// const CardModel = mongoose.model('Card', dataSchema);

// module.exports = CardModel;
