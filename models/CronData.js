const mongoose = require('mongoose');

const CardPriceUpdateSchema = new mongoose.Schema({
  id: String, // Card ID as a string
  name: String, // Card name
  previousPrice: Number, // Previous card price
  updatedPrice: Number, // New updated price after the cron job
  difference: String,
  lastUpdated: Date, // Last updated timestamp for this card's price
  tag: String, // Tag for the card, e.g. 'updated' or 'new'
});
const RunSchema = new mongoose.Schema({
  updated: Date, // The time the cron job ran
  valuesUpdated: {
    updatedPrices: [CardPriceUpdateSchema], // Array of card price updates
    previousDayTotalPrice: Number, // Previous day's total price
    // You can add more fields here as needed
  },
});

const CronDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  runs: [RunSchema],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const CronData = mongoose.model('CronData', CronDataSchema);

module.exports = {
  CronDataSchema,
  CronData,
};
