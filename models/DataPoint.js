const mongoose = require('mongoose');
const { Schema } = mongoose;

const DataPointSchema = new Schema({
  label: String,
  x: Date,
  y: Number,
  // chartData: { type: Schema.Types.ObjectId, ref: 'ChartData' }, // Reference to associated ChartData document
  // Additional fields...
});

module.exports = mongoose.model('DataPoint', DataPointSchema);
