const mongoose = require('mongoose');
const { Schema } = mongoose;
const DatasetSchema = new Schema({
  name: String,
  // priceChangeDetails: {
  //   priceChanged: Boolean,
  //   initialPrice: Number,
  //   updatedPrice: Number,
  //   priceDifference: Number,
  //   priceChange: Number,
  // },
  data: [
    {
      xy: [
        {
          label: String,
          x: Date,
          y: Number,
        },
      ],
      additionalPriceData: [
        {
          // New field to store extra data
          priceChanged: Boolean,
          initialPrice: Number,
          updatedPrice: Number,
          priceDifference: Number,
          priceChange: Number,
        },
      ],
      // additionalPriceData: {
      //   // New field to store extra data
      //   priceChanged: Boolean,
      //   initialPrice: Number,
      //   updatedPrice: Number,
      //   priceDifference: Number,
      //   priceChange: Number,
      // },
    },
  ],
});
const ChartDataSchema = new Schema({
  // name: String,
  // userId: { type: Schema.Types.ObjectId, ref: 'User' },
  // collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
  // datasets: [
  //   {
  //     name: String,
  //     priceChangeDetails: {
  //       priceChanged: Boolean,
  //       initialPrice: Number,
  //       updatedPrice: Number,
  //       priceDifference: Number,
  //       priceChange: Number,
  //     },
  //     data: [
  //       {
  //         label: String,
  //         x: Date,
  //         y: Number,
  //         // dataPoint: { type: Schema.Types.ObjectId, ref: 'DataPoint' },
  //       },
  //     ],
  //   },
  // ],
  // chartData: {
  //   type: Object,
  //   default: {},
  // },
  chartData: {
    name: String,
    datasets: [DatasetSchema], // Use DatasetSchema here
    xys: [
      {
        label: String,
        x: Date,
        y: Number,
      },
    ],
    allXYValues: [
      // New field to store all xy values
      {
        label: String,
        x: Date,
        y: Number,
      },
    ],
  },
});

module.exports = mongoose.model('ChartData', ChartDataSchema);
