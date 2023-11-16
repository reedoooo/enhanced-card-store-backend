const mongoose = require('mongoose');

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
  id: {
    type: String,
    // unique: true,
    required: true,
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
  latestPrice: priceEntrySchema,
  lastSavedPrice: priceEntrySchema,
  priceHistory: [priceEntrySchema],
});

// Create the Mongoose model
const MonitoredCard = mongoose.model('MonitoredCards', monitoredCardSchema);

module.exports = MonitoredCard;
