const mongoose = require('mongoose');

const RunSchema = new mongoose.Schema({
  updated: Date,
  valuesUpdated: Object,
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