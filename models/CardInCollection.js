const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Assuming priceEntrySchema, cardSetSchema, cardImageSchema, cardPriceSchema are already defined
const priceEntrySchema = new Schema({
  num: Number,
  timestamp: Date,
});
const CardImageSchema = new Schema({
  id: {
    type: Number,
    required: false,
  },
  image_url: {
    type: String,
    required: true,
  },

  image_url_small: {
    type: String,
    required: false,
  },
  image_url_cropped: {
    type: String,
    required: false,
  },
});

const CardSetsSchema = new Schema([
  {
    set_name: String,
    set_code: String,
    set_rarity: String,
    set_rarity_code: String,
    set_price: String,
  },
]);

const CardPriceSchema = new Schema({
  tcgplayer_price: {
    type: Number,
    required: true,
  },
  ebay_price: {
    type: Number,
    required: false,
  },
  amazon_price: {
    type: Number,
    required: false,
  },
  cardmarket_price: {
    type: Number,
    required: false,
  },
  coolstuffinc_price: {
    type: Number,
    required: false,
  },
});

// Card Set Schema
const cardSetSchema = new Schema({
  set_name: String,
  set_code: String,
  set_rarity: String,
  set_rarity_code: String,
  set_price: mongoose.Types.Decimal128,
});

// Card Image Schema
const cardImageSchema = new Schema({
  id: Number,
  image_url: String,
  image_url_small: String,
  image_url_cropped: String,
});

// Card Price Schema
const cardPriceSchema = new Schema({
  cardmarket_price: mongoose.Types.Decimal128,
  tcgplayer_price: mongoose.Types.Decimal128,
  ebay_price: mongoose.Types.Decimal128,
  amazon_price: mongoose.Types.Decimal128,
  coolstuffinc_price: mongoose.Types.Decimal128,
});

const CardInCollectionSchema = new Schema({
  id: { type: String, required: true },
  collectionId: { type: String, required: false },
  tag: { type: String, required: false },
  price: { type: Number, required: false },
  totalPrice: {
    type: Number,
    set: function (v) {
      return !isNaN(v) ? v : 0;
    },
  },
  quantity: { type: Number, required: false },
  name: { type: String, required: true },
  latestPrice: priceEntrySchema,
  lastSavedPrice: priceEntrySchema,
  priceHistory: [priceEntrySchema],
  dailyPriceHistory: [priceEntrySchema],
  chart_datasets: [
    {
      x: { type: String, required: true },
      y: { type: Number, required: true },
    },
  ],
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
  card_sets: [cardSetSchema],
  card_images: [cardImageSchema],
  card_prices: [cardPriceSchema],
});

const CardInCollection = mongoose.model('CardInCollection', CardInCollectionSchema);

module.exports = CardInCollection;
