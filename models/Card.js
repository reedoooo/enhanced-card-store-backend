const mongoose = require('mongoose');
const CardBaseSchema = require('./CardBase').schema;

const CardSchema = new mongoose.Schema(
  {
    ...CardBaseSchema.obj,
    price: Number,
    totalPrice: Number,
    chart_datasets: [
      {
        x: Date,
        y: Number,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Card', CardSchema);
