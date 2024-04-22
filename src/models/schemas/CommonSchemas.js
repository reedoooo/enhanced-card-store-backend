// Require Mongoose
const mongoose = require('mongoose');
const logger = require('../../configs/winston');
const { Schema, Types } = mongoose;
const { v4: uuidv4 } = require('uuid');
const requiredString = { type: String, required: true };
const requiredDecimal128 = { type: Types.Decimal128, required: true };
const commonSchemaOptions = { timestamps: true };
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
  cardId: { type: Schema.Types.ObjectId, refPath: 'cardModel', required: true },
});
const createSchema = (fields, options = {}) => new Schema(fields, { _id: false, ...options });
function arrayLimit(val) {
  // Mapping of chart data IDs to their maximum lengths
  const limits = {
    '24hr': 24,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '270d': 270,
    '365d': 365,
  };

  // Use 'this.id' to access the id of the chart and apply the appropriate limit
  return val.length <= (limits[this.id] || 0);
}
async function updateTotals(cardModel, cardsField) {
  this.totalPrice = 0;
  this.totalQuantity = 0;

  if (this[cardsField]?.length > 0) {
    const items = await cardModel.find({ _id: { $in: this[cardsField] } });
    items.forEach((item) => {
      this.totalPrice += item.price * item.quantity;
      this.totalQuantity += item.quantity;
    });
  }
}
const createCommonFields = () => ({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  totalPrice: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
});
const createSchemaWithCommonFields = (cardsRef, schemaName) => {
  const schema = new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      totalPrice: { type: Number, default: 0 },
      totalQuantity: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 },
      name: String,
      description: String,
      [cardsRef]: [{ type: Schema.Types.ObjectId, ref: schemaName }],
      tags: {
        type: Array,
        of: String,
        default: ['tags'],
      },
      selectedTags: {
        type: Array,
        of: String,
        default: ['tags'],
      },
      color: {
        type: String,
        enum: ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'],
        default: 'blue',
      },
    },
    { timestamps: true },
  );

  schema.pre('save', async function (next) {
    await updateTotals.call(this, mongoose.model(schemaName), cardsRef);
    next();
  });

  return schema;
};
const priceEntrySchema = createSchema({
  num: { type: Number, min: 0 },
  timestamp: { type: Date, default: Date.now },
});
const createNewPriceEntry = (price) => {
  return {
    num: price,
    timestamp: new Date(),
  };
};
const cardImageSchema = createSchema({
  // id: { type: String, required: true },
  id: { type: Number, required: false },
  image_url: { type: String, required: true },
  image_url_small: String,
  image_url_cropped: String,
});
const cardPriceSchema = createSchema(createPriceFields());
const chartDatasetEntrySchema = new Schema(
  {
    label: String,
    data: [
      {
        id: String,
        x: Date,
        y: Number,
      },
    ],
  },
  { _id: false },
);
const cardSetSchema = new Schema(
  {
    set_name: String,
    set_code: requiredString,
    set_rarity: String,
    set_rarity_code: String,
    set_price: requiredDecimal128,
    ...createReferenceFields(['CardInCollection', 'CardInDeck', 'CardInCart']),
  },
  commonSchemaOptions,
);
cardSetSchema.index({ set_code: 1 }); // Index for performance
const cardVariantSchema = new Schema(
  {
    set_name: String,
    set_code: String,
    rarity: String,
    rarity_code: String,
    price: { type: Types.Decimal128, default: 0 },
    selected: { type: Boolean, default: false },
    alt_art_image_url: String,
    set: requiredObjectId('CardSet'),
    ...createReferenceFields(['CardInCollection', 'CardInDeck', 'CardInCart']),
  },
  { timestamps: true },
);
const collectionPriceChangeHistorySchema = new Schema({
  timestamp: Date,
  difference: Number,
  priceChanges: [
    {
      timestamp: Date,
      difference: Number,
      collectionName: String,
      cardName: String,
      oldPrice: Number,
      newPrice: Number,
      priceDifference: Number,
      message: String,
    },
  ],
});
const collectionStatisticsSchema = new Schema({
  highPoint: { type: Number, min: 0 },
  lowPoint: { type: Number, min: 0 },
  average: { type: Number, min: 0 },
  percentageChange: { type: Number },
  priceChange: { type: Number },
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
const dataPointSchema = createSchema(
  {
    label: { type: String, required: false, default: 'Label' },
    id: { type: String, required: false },
    x: { type: Date, required: false, default: Date.now },
    y: { type: Number, min: 0, required: false, default: 0 },
  },
  { _id: false },
);
const createDataPoint = (x, y, stringVal) => ({
  label: `${Date.now()}`,
  // label: `${stringVal}: [${y}] [${x}]`,
  id: uuidv4(),  // Generates a unique identifier
  // id: `${Date.now()}`,
  x,
  y,
  // x: new Date(),
  // y: 0,
});
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
const averagedDataSchema = new Schema(
  {
    id: String,
    color: String,
    data: [
      {
        id: String,
        x: Date,
        y: Number,
      },
    ],
  },
  { _id: false },
);
function calculateContextualQuantity(card, context) {
  logger.info('calculating contextual quantity for: ', card.name, 'in context: ', context);
  switch (context) {
    case 'SearchHistory':
      return card.quantity;
    case 'Deck':
      return card.quantity;
    case 'Collection':
      return card.quantity;
    case 'Cart':
      return card.quantity;
    default:
      throw new Error('Invalid context');
  }
}

module.exports = {
  priceEntrySchema,
  commonSchemaOptions,
  cardSetSchema,
  cardImageSchema,
  cardPriceSchema,
  cardVariantSchema,
  collectionStatisticsSchema,
  collectionPriceChangeHistorySchema,
  averagedDataSchema,
  chartDatasetEntrySchema,
  chartDataSchema,
  dataPointSchema,
  createCommonFields,
  createSchemaWithCommonFields,
  updateTotals,
  calculateContextualQuantity,
  createNewPriceEntry,
  createDataPoint,
};
