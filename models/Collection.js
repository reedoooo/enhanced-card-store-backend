const mongoose = require('mongoose');
const { Schema } = mongoose;
// Import the CardInCollection model
const CardInCollection = require('./CardInCollection'); // Adjust the path as per your project structure

// const CardImageSchema = new Schema({
//   id: {
//     type: Number,
//     required: false,
//   },
//   image_url: {
//     type: String,
//     required: true,
//   },

//   image_url_small: {
//     type: String,
//     required: false,
//   },
//   image_url_cropped: {
//     type: String,
//     required: false,
//   },
// });

// const CardSetsSchema = new Schema([
//   {
//     set_name: String,
//     set_code: String,
//     set_rarity: String,
//     set_rarity_code: String,
//     set_price: String,
//   },
// ]);

// const CardPriceSchema = new Schema({
//   tcgplayer_price: {
//     type: Number,
//     required: true,
//   },
//   ebay_price: {
//     type: Number,
//     required: false,
//   },
//   amazon_price: {
//     type: Number,
//     required: false,
//   },
//   cardmarket_price: {
//     type: Number,
//     required: false,
//   },
//   coolstuffinc_price: {
//     type: Number,
//     required: false,
//   },
// });

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

// const CardInCollectionSchema = new Schema({
//   id: { type: String, required: true },
//   collectionId: { type: String, required: false },
//   tag: {
//     type: String,
//     required: false,
//   },
//   price: { type: Number, required: false },
//   // totalPrice: { type: Number, required: false },
//   totalPrice: {
//     type: Number,
//     set: function (v) {
//       return !isNaN(v) ? v : 0;
//     },
//   },
//   quantity: {
//     type: Number,
//     required: false,
//   },
//   // totalPrice: Number,
//   name: {
//     type: String,
//     required: true,
//   },
//   latestPrice: priceEntrySchema,
//   lastSavedPrice: priceEntrySchema,
//   priceHistory: [priceEntrySchema],
//   dailyPriceHistory: [priceEntrySchema],
//   chart_datasets: [
//     {
//       x: { type: String, required: true },
//       y: { type: Number, required: true },
//     },
//   ],
//   // previously in CardBaseSchema
//   type: String,
//   frameType: String,
//   desc: String,
//   atk: Number,
//   def: Number,
//   level: Number,
//   race: String,
//   attribute: String,
//   archetype: [String],
//   image: String,
//   card_sets: [CardSetsSchema],
//   card_images: [CardImageSchema],
//   card_prices: [CardPriceSchema],
// });

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
  totalPrice: Number,
  quantity: Number,
  totalQuantity: Number,
  previousDayTotalPrice: Number,
  dailyPriceChange: String,
  priceDifference: Number,
  priceChange: Number,
  latestPrice: priceEntrySchema,
  lastSavedPrice: priceEntrySchema,
  collectionPriceHistory: [collectionPriceHistorySchema],
  dailyCollectionPriceHistory: [collectionPriceHistorySchema],
  // cards: [CardInCollectionSchema],
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CardInCollection' }], // Reference to CardInCollection

  currentChartDataSets2: [
    {
      label: String,
      x: Date,
      y: Number,
    },
  ],
  // xys: [
  //   {
  //     label: String,
  //     data: { x: Date, y: Number },
  //   },
  // ],
  chartData: {
    name: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    datasets: [DatasetSchema], // Use DatasetSchema here
    // xys: [
    //   {
    //     label: String,
    //     data: { x: Date, y: Number },
    //   },
    // ],
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
