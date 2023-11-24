const mongoose = require('mongoose');
const CardBaseSchema = require('./CardBase').schema;

// Schema for the price entry
const priceEntrySchema = new mongoose.Schema({
  num: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

// Schema for the card
const monitoredCardSchema = new mongoose.Schema({
  ...CardBaseSchema.obj,
  id: {
    type: String,
    // unique: true,
    required: true,
  },
  collectionId: {
    type: String,
    required: false,
  },
  tag: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: false,
  },
  price: { type: Number, required: false },
  totalPrice: Number,
  chart_datasets: [
    {
      x: { type: String, required: true },
      y: { type: Number, required: true },
    },
  ],
  latestPrice: priceEntrySchema,
  lastSavedPrice: priceEntrySchema,
  priceHistory: [priceEntrySchema],
});

// Create the Mongoose model
const MonitoredCard = mongoose.model('MonitoredCards', monitoredCardSchema);

module.exports = MonitoredCard;
