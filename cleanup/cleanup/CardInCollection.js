// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// // Price Entry Schema
// const priceEntrySchema = new Schema({
//   num: Number,
//   timestamp: Date,
// });

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

// // Chart_Datasets Schema
// const chartDatasetsSchema = new Schema({
//   x: { type: String, required: false },
//   y: { type: Number, required: false },
// });

// // Card In Collection Schema
// const CardInCollectionSchema = new Schema({
//   // custom data
//   id: { type: String, required: true, unique: true },
//   collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection' },
//   tag: { type: String, required: false },
//   watchList: { type: Boolean, required: false },
//   price: { type: Number, required: false },
//   totalPrice: {
//     type: Number,
//     set: function (v) {
//       return !isNaN(v) ? v : 0;
//     },
//   },
//   quantity: { type: Number, required: false },
//   latestPrice: priceEntrySchema,
//   lastSavedPrice: priceEntrySchema,
//   dataOfLastPriceUpdate: Date,
//   priceHistory: [priceEntrySchema],
//   dailyPriceHistory: [priceEntrySchema],
//   chart_datasets: [chartDatasetsSchema],
//   card_set: {
//     set_name: String,
//     set_code: String,
//     set_rarity: String,
//     set_rarity_code: String,
//     set_price: mongoose.Types.Decimal128,
//   },
//   rarity: {
//     type: String,
//     required: false,
//   },

//   //? PRESET CARD DATA
//   // STATIC DATA
//   name: { type: String, required: true },
//   image: String,
//   type: String,
//   frameType: String,
//   desc: String,
//   atk: Number,
//   def: Number,
//   level: Number,
//   race: String,
//   attribute: String,
//   archetype: [String],
//   card_sets: [cardSetSchema],
//   card_images: [cardImageSchema],
//   // CHANGING DATA
//   card_prices: [cardPriceSchema],
// });

// const CardInCollection = mongoose.model('CardInCollection', CardInCollectionSchema);

// module.exports = CardInCollection;