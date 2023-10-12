const mongoose = require('mongoose');
const { Schema } = mongoose;
const ChartDataSchema = new Schema({
  name: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
  datasets: [
    {
      name: String,
      priceChangeDetails: {
        priceChanged: Boolean,
        initialPrice: Number,
        updatedPrice: Number,
        priceDifference: Number,
        priceChange: Number,
      },
      data: [
        {
          label: String,
          x: Date,
          y: Number,
        },
      ],
    },
  ],
  chartData: {
    type: Object,
    default: {},
  },
});

module.exports = mongoose.model('ChartData', ChartDataSchema);
