// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const priceEntrySchema = require('../other/priceEntrySchema');

// const cardVariantSchema = new Schema({
//   set_code: { type: String, required: true }, // Unique for each variant
//   set_name: String,
//   set_rarity: String,
//   set_rarity_code: String,
//   set_price: mongoose.Types.Decimal128,
//   tag: String,
//   watchList: { type: Boolean, default: false },
//   price: { type: Number, min: 0 }, // Ensure price is not negative
//   totalPrice: { type: Number, min: 0 },
//   quantity: { type: Number, min: 0 }, // Ensure quantity is not negative
//   latestPrice: priceEntrySchema,
//   lastSavedPrice: priceEntrySchema,
//   dataOfLastPriceUpdate: { type: Date, default: Date.now },
//   priceHistory: [priceEntrySchema],
//   dailyPriceHistory: [priceEntrySchema],
//   chart_datasets: [new Schema({ x: String, y: Number }, { _id: false })],
//   rarity: String,
// });

// module.exports = cardVariantSchema;
