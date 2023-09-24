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

const CardPriceSchema = new Schema({
  tcgplayer_price: {
    type: Number,
    required: true,
  },
});

const CardInCollectionSchema = new Schema({
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
    required: true,
  },
});

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  cards: [CardInCollectionSchema],
  totalPrice: {
    type: Number,
  },
  allCardPrices: {
    type: Array,
  },
  quantity: {
    type: Number,
  },
});

module.exports = mongoose.model('Collection', collectionSchema);
