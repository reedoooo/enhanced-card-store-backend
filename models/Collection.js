const mongoose = require('mongoose');
const { Schema } = mongoose;
const CardBaseSchema = require('./CardBase').schema;

const CardImageSchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
});
const CardSetsSchema = new Schema({
  id: {
    type: Number,
    // required: true,
  },
  image_url: {
    type: String,
    // required: true,
  },
});

const priceEntrySchema = new mongoose.Schema({
  num: {
    type: Number,
    // required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

const CardPriceSchema = new Schema({
  tcgplayer_price: {
    type: Number,
    required: true,
  },
});

const CardInCollectionSchema = new Schema({
  id: { type: String, required: true },
  collectionId: { type: String, required: false },
  tag: {
    type: String,
    required: false,
  },
  price: { type: Number, required: false },
  totalPrice: { type: Number, required: false },
  quantity: {
    type: Number,
    required: false,
  },
  // totalPrice: Number,
  name: {
    type: String,
    required: true,
  },
  latestPrice: priceEntrySchema,
  lastSavedPrice: priceEntrySchema,
  priceHistory: [priceEntrySchema],
  chart_datasets: [
    {
      x: { type: String, required: true },
      y: { type: Number, required: true },
    },
  ],
  // previously in CardBaseSchema
  type: String,
  frameType: String,
  desc: String,
  atk: Number,
  def: Number,
  level: Number,
  race: String,
  attribute: String,
  archetype: [String],
  image: String,
  card_sets: [CardSetsSchema],
  card_images: [CardImageSchema],
  card_prices: [CardPriceSchema],
});

const DatasetSchema = new Schema({
  name: String,
  data: [
    {
      xys: [
        {
          label: String,
          data: { x: Date, y: Number },
        },
      ],
      additionalPriceData: [
        {
          priceChanged: Boolean,
          initialPrice: Number,
          updatedPrice: Number,
          priceDifference: Number,
          priceChange: Number,
        },
      ],
    },
  ],
});

const collectionPriceHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
  },
  num: {
    type: Number,
    required: false,
  },
});

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  totalCost: String,
  totalPrice: Number,
  quantity: Number,
  totalQuantity: Number,
  previousDayTotalPrice: Number,
  dailyPriceChange: String,
  priceDifference: Number,
  priceChange: Number,
  allCardPrices: Array,
  latestPrice: priceEntrySchema,
  lastSavedPrice: priceEntrySchema,
  collectionPriceHistory: [collectionPriceHistorySchema],
  cards: [CardInCollectionSchema],
  currentChartDataSets: [
    // id: String,
    // data: {
    //   x: Date,
    //   y: Number,
    // },
    {
      label: String,
      x: Date,
      y: Number,
    },
  ],
  currentChartDataSets2: [
    {
      label: String,
      x: Date,
      y: Number,
    },
  ],
  xys: [
    {
      label: String,
      data: { x: Date, y: Number },
    },
  ],
  chartData: {
    name: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    datasets: [DatasetSchema], // Use DatasetSchema here
    xys: [
      {
        label: String,
        data: { x: Date, y: Number },
      },
    ],
    allXYValues: [
      {
        label: String,
        x: Date,
        y: Number,
      },
    ],
  },
});

// collectionSchema.pre('save', function (next) {
//   if (!this.cards.every(validateCardInCollection)) {
//     console.error('Validation failed for one or more cards in the collection');
//     next(new Error('Validation failed'));
//   } else {
//     next();
//   }
// });

module.exports = mongoose.model('Collection', collectionSchema);
