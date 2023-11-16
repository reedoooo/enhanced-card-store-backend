const mongoose = require('mongoose');
const { Schema } = mongoose;
const CardBaseSchema = require('./CardBase').schema;

const priceEntrySchema = new mongoose.Schema({
  num: {
    type: Number,
    // required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

const CardInCollectionSchema = new Schema({
  ...CardBaseSchema.obj,
  id: { type: String, required: true },
  tag: {
    type: String,
    required: true,
  },
  price: Number,
  totalPrice: Number,
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: false,
  },
  latestPrice: priceEntrySchema,
  lastSavedPrice: priceEntrySchema,
  priceHistory: [priceEntrySchema],
  chart_datasets: [
    {
      x: { type: String, required: true },
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

const collectionPriceHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
  },
  num: {
    type: Number,
    required: true,
  },
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
  dailyPriceChange: String,
  priceDifference: Number,
  priceChange: Number,
  allCardPrices: Array,
  collectionPriceHistory: [collectionPriceHistorySchema],
  cards: [CardInCollectionSchema],
  currentChartDataSets: [
    // id: String,
    // data: {
    //   x: Date,
    //   y: Number,
    // },
    {
      label: String,
      x: Date,
      y: Number,
    },
  ],
  currentChartDataSets2: [
    {
      label: String,
      x: Date,
      y: Number,
    },
  ],
  xys: [
    {
      label: String,
      data: { x: Date, y: Number },
    },
  ],
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
