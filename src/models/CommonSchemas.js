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
// Common schema fields as functions to apply DRY
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

// Simplifying schema creation
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

// Define the inner data structure inside the 'data' array
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

// Define the main structure of each object in the 'nivoChartData' array
const chartDataSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false,
  },
  color: {
    type: String,
  },
  data: [nivoDataPointSchema],
});

// Define the schema for the overall document, which includes 'nivoChartData' as an array
const nivoChartSchema = new Schema({
  nivoChartData: [chartDataSchema],
});

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
const dataPointSchema = new Schema(
  {
    x: String,
    y: Number,
    label: String,
  },
  { _id: false }
); // Define this if you have a consistent structure for data points

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
  nivoChartSchema,
};
