const mongoose = require('mongoose');
const { validateCardInCollection } = require('../controllers/validateCollection');
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

const DatasetSchema = new Schema({
  name: String,
  data: [
    {
      xys: [
        {
          label: String,
          data: { x: Date, y: Number },
        },
      ],
      additionalPriceData: [
        {
          priceChanged: Boolean,
          initialPrice: Number,
          updatedPrice: Number,
          priceDifference: Number,
          priceChange: Number,
        },
      ],
    },
  ],
});

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  totalCost: String,
  totalPrice: Number,
  quantity: Number,
  totalQuantity: Number,
  previousDayTotalPrice: Number,
  dailyPriceChange: Number,
  priceDifference: Number,
  priceChange: Number,
  allCardPrices: Array,
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
  xys: [
    {
      label: String,
      data: { x: Date, y: Number },
    },
  ],
  // {
  //   x: Date,
  //   y: Number,
  // },
  chartData: {
    name: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    datasets: [DatasetSchema], // Use DatasetSchema here
    xys: [
      {
        label: String,
        data: { x: Date, y: Number },
      },
    ],
    allXYValues: [
      // New field to store all xy values
      {
        label: String,
        x: Date,
        y: Number,
      },
    ],
  },
});

// collectionSchema.pre('save', function (next) {
//   if (!this.cards.every(validateCardInCollection)) {
//     console.error('Validation failed for one or more cards in the collection');
//     next(new Error('Validation failed'));
//   } else {
//     next();
//   }
// });

module.exports = mongoose.model('Collection', collectionSchema);
