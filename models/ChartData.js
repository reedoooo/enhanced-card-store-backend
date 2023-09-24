const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChartDataSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  data: [
    {
      x: String,
      y: mongoose.Schema.Types.Mixed, // Use Mixed if y can be different types, otherwise specify the type
      _id: false,
    },
  ],
  datasets: {
    type: Array,
    default: [],
  },
  // Add other fields as necessary
});

module.exports = mongoose.model('ChartData', ChartDataSchema);