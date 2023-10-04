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

const ChartDataInCollectionSchema = new Schema({
  name: String,
  userId: String,
  userIdObject: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  chartDataRef: {
    // This field will store the ObjectId of the related ChartData document.
    type: Schema.Types.ObjectId,
    ref: 'ChartData', // Assuming that your model is named 'ChartData'
  },
  _id: false,
  priceChanged: {
    type: Boolean,
    required: false,
  },
  datasets: {
    type: Array,
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
  chartData: [ChartDataInCollectionSchema],
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

const CollectionModel = mongoose.model('Collection', collectionSchema);
module.exports = {
  CollectionModel,
  collectionSchema,
};
module.exports = mongoose.model('Collection', collectionSchema);
