// Require Mongoose
const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
// Enhanced DRY approach: Common field configurations
const requiredString = { type: String, required: true };
const requiredDecimal128 = { type: Types.Decimal128, required: true };
const requiredObjectId = (refPath) => ({
  type: Schema.Types.ObjectId,
  refPath,
  required: true,
});
const createPriceFields = () => ({
  cardmarket_price: requiredDecimal128,
  tcgplayer_price: Types.Decimal128,
  ebay_price: Types.Decimal128,
  amazon_price: Types.Decimal128,
  coolstuffinc_price: Types.Decimal128,
});
const createReferenceFields = (enumOptions) => ({
  cardModel: { type: String, enum: enumOptions, required: true },
  cardId: { type: Schema.Types.ObjectId, refPath: "cardModel", required: true },
});
const createSchema = (fields, options = {}) =>
  new Schema(fields, { _id: false, ...options });
const priceEntrySchema = createSchema({
  num: { type: Number, min: 0 },
  timestamp: { type: Date, default: Date.now },
});
const cardImageSchema = createSchema({
  // id: { type: String, required: true },
  id: { type: Number, required: false },
  image_url: { type: String, required: true },
  image_url_small: String,
  image_url_cropped: String,
});
const cardPriceSchema = createSchema(createPriceFields());
const chartDatasetsSchema = createSchema({
  label: String,
  x: Date,
  y: { type: Number, min: 0 },
});
const collectionPriceHistorySchema = createSchema({
  timestamp: { type: Date, default: Date.now },
  num: { type: Number, min: 0 },
});
const nivoDataPointSchema = new Schema({
  label: {
    type: String,
    enum: ["24h", "7d", "30d", "90d", "180d", "270d", "365d"],
    required: true,
  },
  x: {
    type: Date,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
});
// const chartDataSchema = new Schema({
//   id: {
//     type: String,
//     required: true,
//   },
//   name: {
//     type: String,
//     required: false,
//   },
//   color: {
//     type: String,
//   },
//   growth: { type: Number, min: 0 },
//   data: [nivoDataPointSchema],
// });
// const nivoChartSchema = new Schema({
//   nivoChartData: [chartDataSchema],
// });
const cardSetSchema = new Schema(
  {
    set_name: String,
    set_code: requiredString,
    set_rarity: String,
    set_rarity_code: String,
    set_price: requiredDecimal128,
    ...createReferenceFields([
      "CardInSearch",
      "CardInCollection",
      "CardInDeck",
      "CardInCart",
    ]),
  },
  { timestamps: true }
);
cardSetSchema.index({ set_code: 1 }); // Index for performance
const cardVariantSchema = new Schema(
  {
    set_name: String,
    set_code: requiredString,
    rarity: String,
    rarity_code: String,
    price: requiredDecimal128,
    selected: { type: Boolean, default: false },
    alt_art_image_url: String,
    set: requiredObjectId("CardSet"),
    ...createReferenceFields([
      "CardInSearch",
      "CardInCollection",
      "CardInDeck",
      "CardInCart",
    ]),
  },
  { timestamps: true }
);
const searchTermSchema = createSchema({
  name: String,
  race: String,
  attribute: String,
  type: String,
  level: { type: Number, min: 0 },
  id: requiredString,
});
const searchResultSchema = createSchema({
  cardId: requiredObjectId("CardInSearch"),
});
const searchSessionSchema = new Schema(
  {
    label: requiredString,
    searchTerms: [searchTermSchema],
    results: [searchResultSchema],
  },
  { timestamps: true }
);
// const dataPointSchema = new Schema(
//   {
//     x: String,
//     y: Number,
//     label: String,
//   },
//   { _id: false }
// );
const chartDataPointSchema = new Schema({
  x: Date,
  y: Number
}, { _id: false }); // Optional: Disable _id for subdocument
const collectionPriceChangeHistorySchema = new Schema({
  timestamp: Date,
  priceChanges: [
    {
      collectionName: String,
      cardName: String,
      oldPrice: Number,
      newPrice: Number,
      priceDifference: Number,
      message: String,
    },
  ],
  difference: Number,
});
const collectionStatisticsSchema = new Schema({
  highPoint: { type: Number, min: 0 },
  lowPoint: { type: Number, min: 0 },
  average: { type: Number, min: 0 },
  percentageChange: { type: Number, min: 0 },
  priceChange: { type: Number, min: 0 },
  avgPrice: { type: Number, min: 0 },
  volume: { type: Number, min: 0 },
  volatility: { type: Number, min: 0 },
  twentyFourHourAverage: {
    startDate: Date,
    endDate: Date,
    lowPoint: Number,
    highPoint: Number,
    priceChange: Number,
    percentageChange: Number,
    priceIncreased: Boolean,
  },
});
// Define a schema for the individual data points in each chart
const dataPointSchema = new Schema({
  label: String,
  x: Date,
  y: Number,
});

// Define a schema for the chart data, applying validation to the data array
const chartDataSchema = new Schema({
  id: String,
  name: String,
  color: String,
  growth: Number,
  data: {
    type: [dataPointSchema],
    validate: [arrayLimit, `{PATH} exceeds the limit of {VALUE}`],
  },
});

const averagedDataSchema = new Schema({
  id: String,
  color: String,
  data: [{
    x: Date,
    y: Number
  }]
}, { _id: false });

// Function to enforce array length limits based on the id
function arrayLimit(val) {
  // Mapping of chart data IDs to their maximum lengths
  const limits = {
    "24hr": 24,
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "180d": 180,
    "270d": 270,
    "365d": 365,
  };

  // Use 'this.id' to access the id of the chart and apply the appropriate limit
  return val.length <= (limits[this.id] || 0);
}

module.exports = {
  priceEntrySchema,
  cardSetSchema,
  cardImageSchema,
  cardPriceSchema,
  chartDatasetsSchema,
  collectionPriceHistorySchema,
  collectionPriceChangeHistorySchema,
  cardVariantSchema,
  dataPointSchema,
  searchTermSchema,
  searchResultSchema,
  searchSessionSchema,
  collectionStatisticsSchema,
  chartDataSchema,
  nivoDataPointSchema,
  chartDataPointSchema,
  averagedDataSchema,
};
