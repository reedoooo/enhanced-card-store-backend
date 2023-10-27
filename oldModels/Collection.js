const mongoose = require('mongoose');
const { Schema } = mongoose;

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

const CardPriceSchema = new Schema({
  tcgplayer_price: {
    type: Number,
    required: true,
  },
});

const ChartDataSchema = new Schema({
  name: String,
  userId: String,
  collectionId: {
    type: Schema.Types.ObjectId,
    ref: 'Collection',
  },
  priceChanged: Boolean,
  priceDifference: Number,
  cardName: String,
  cardId: String,
  default: {},
  allXYValues: [
    {
      label: String,
      x: Date,
      y: Number,
    },
  ],
  datasets: [
    {
      name: String,
      priceChanged: Boolean,
      initialPrice: Number,
      updatedPrice: Number,
      priceDifference: Number,
      priceChange: Number,
      data: [
        {
          xy: {
            label: String,
            x: Date,
            y: Number,
          },
          additionalPriceData: {
            priceChanged: Boolean,
            initialPrice: Number,
            updatedPrice: Number,
            priceDifference: Number,
            priceChange: Number,
          },
        },
      ],
    },
  ],
  chartData: {
    type: Object,
    default: {},
    validate: {
      validator: function (v) {
        return !Array.isArray(v);
      },
      message: (props) => 'chartData should not be an array!',
    },
  },
});

const CardInCollectionSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: String,
  frameType: String,
  description: String,
  atk: Number,
  def: Number,
  level: Number,
  race: String,
  attribute: String,
  archetype: [String],
  card_images: [CardImageSchema],
  card_prices: [CardPriceSchema],
  price: {
    type: Number,
    // required: true,
  },
  totalPrice: {
    type: Number,
    // required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
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
});

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chartId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartData' }, // Reference the ChartData model
  name: String,
  description: String,
  cards: [CardInCollectionSchema],
  // chartData: ChartDataSchema,
  totalCost: {
    type: String,
  },
  totalPrice: {
    type: Number,
  },
  allCardPrices: {
    type: Array,
  },
  quantity: {
    type: Number,
  },
  totalQuantity: {
    type: Number,
  },
  chartData: {
    type: ChartDataSchema,
    default: {},
    validate: {
      validator: function (v) {
        return !Array.isArray(v);
      },
      message: (props) => 'chartData should not be an array!',
    },
  },
});

// collectionSchema.pre('save', function (next) {
//   if (Array.isArray(this.chartData)) {
//     console.warn('chartData is an array, converting to an empty object');
//     this.chartData = {};
//   }
//   next();
// });

const Collection = mongoose.model('Collection', collectionSchema);
const ChartData = mongoose.model('ChartData', ChartDataSchema);

module.exports = {
  collectionSchema,
  Collection,
  ChartDataSchema,
  ChartData,
};

// module.exports = mongoose.model('Collection', collectionSchema);
// module.exports = mongoose.model('ChartData', ChartDataSchema);
