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
  card: { type: Schema.Types.ObjectId, ref: 'CardBase' }, // reference to the CardBase
  price: {
    type: Number,
    // required: true,
  },
  totalPrice: {
    type: Number,
    // required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  chart_datasets: [
    {
      x: {
        type: Date,
        required: true,
      },
      y: {
        type: Number,
        required: true,
      },
    },
  ],
});

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  cards: [CardInCollectionSchema],
  totalCost: String,
  totalPrice: Number,
  quantity: Number,
  totalQuantity: Number,
  chartData: { type: Schema.Types.ObjectId, ref: 'ChartData' },
});

module.exports = mongoose.model('Collection', collectionSchema);
