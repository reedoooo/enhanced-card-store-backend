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
const simulatedCardSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
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
  latestPrice: priceEntrySchema,
  lastSavedPrice: priceEntrySchema,
  priceHistory: [priceEntrySchema],
});

// Create the Mongoose model
const SimulatedCard = mongoose.model('SimulatedCard', simulatedCardSchema);

module.exports = SimulatedCard;
