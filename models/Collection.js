const mongoose = require('mongoose');
const { Schema } = mongoose;
// Import the CardInCollection model
const CardInCollection = require('./CardInCollection'); // Adjust the path as per your project structure

const priceEntrySchema = new mongoose.Schema({
  num: {
    type: Number,
    required: false,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});
const collectionPriceHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
  },
  num: {
    type: Number,
    required: false,
  },
});

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  totalPrice: Number,
  quantity: Number,
  totalQuantity: Number,
  previousDayTotalPrice: Number,
  dailyPriceChange: String,
  priceDifference: Number,
  priceChange: Number,
  latestPrice: priceEntrySchema,
  lastSavedPrice: priceEntrySchema,
  collectionPriceHistory: [collectionPriceHistorySchema],
  dailyCollectionPriceHistory: [collectionPriceHistorySchema],
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CardInCollection' }], // Reference to CardInCollection
  currentChartDataSets2: [
    {
      label: String,
      x: Date,
      y: Number,
    },
  ],
  chartData: {
    name: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    // datasets: [DatasetSchema],
    allXYValues: [
      {
        label: String,
        x: Date,
        y: Number,
      },
    ],
  },
});

module.exports = mongoose.model('Collection', collectionSchema);
