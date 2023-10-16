const mongoose = require('mongoose');
const { Schema } = mongoose;
const CardBaseSchema = require('./CardBase').schema;

const CardInCollectionSchema = new Schema({
  ...CardBaseSchema.obj,
  id: { type: String, required: true },
  price: Number,
  totalPrice: Number,
  quantity: { type: Number, required: true },
  chart_datasets: [
    {
      x: { type: Date, required: true },
      y: { type: Number, required: true },
    },
  ],
});

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  cards: [CardInCollectionSchema],
  currentChartDatasets: [
    {
      id: String,
      data: {
        x: Date,
        y: Number,
      },
    },
  ],
  totalCost: String,
  totalPrice: Number,
  quantity: Number,
  totalQuantity: Number,
  // chartData: { type: Schema.Types.ObjectId, ref: 'ChartData' },
  xy: {
    x: Date,
    y: Number,
  },
  chartData: {
    name: String,
    datasets: [
      {
        name: String,
        priceChangeDetails: {
          priceChanged: Boolean,
          initialPrice: Number,
          updatedPrice: Number,
          priceDifference: Number,
          priceChange: Number,
        },
        data: [
          {
            label: String,
            x: Date,
            y: Number,
          },
        ],
      },
    ],
    chartData: {
      type: Object,
      default: {},
    },
  },
});

module.exports = mongoose.model('Collection', collectionSchema);
