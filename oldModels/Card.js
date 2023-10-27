const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      // required: true,
    },
    frameType: {
      type: String,
      // required: true,
    },
    desc: {
      type: String,
      // required: true,
    },
    atk: {
      type: Number,
      // required: true,
    },
    def: {
      type: Number,
      // required: true,
    },
    level: {
      type: Number,
      // required: true,
    },
    race: {
      type: String,
      // required: true,
    },
    attribute: {
      type: String,
      // required: true,
    },
    card_images: [
      {
        id: {
          type: Number,
          required: true,
        },
        image_url: {
          type: String,
          required: true,
        },
      },
    ],
    price: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      // required: true,
    },
    card_prices: [
      {
        tcgplayer_price: {
          type: Number,
          required: true,
        },
      },
    ],
    chart_datasets: [
      {
        x: {
          type: Date,
          required: true,
        },
        y: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Card', CardSchema);
