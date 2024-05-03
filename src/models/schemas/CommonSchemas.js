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
  cardmarket_price: Types.Decimal128,
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
        of: Object,
        default: [
          {
            id: uuidv4(),
            label: 'defaultTag',
          },
        ],
      },
      selectedTagValue: {
        type: String,
        default: 'defaultTag',
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
    if (schemaName === 'Deck') { 
      if (!this.tags[0].label) {
        this.tags[0] = {
          id: uuidv4(),
          label: 'defaultTag',
        };
        this.selectedTag = 'defaultTag';
      }
    }
    next();
  });

  return schema;
};
const priceEntrySchema = createSchema({
  num: { type: Number },
  timestamp: { type: Date },
});
const cardImageSchema = createSchema({
  // id: { type: String, required: true },
  id: { type: Number, required: false },
  image_url: { type: String, required: true },
  image_url_small: String,
  image_url_cropped: String,
});
const cardPriceSchema = createSchema(createPriceFields());
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
const dataPointSchema = createSchema(
  {
    label: { type: String, required: false, default: 'Label' },
    id: { type: String, required: false },
    x: { type: Date, required: false },
    y: { type: Number, min: 0, required: false, default: 0 },
  },
  { _id: false },
);
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
module.exports = {
  priceEntrySchema,
  commonSchemaOptions,
  cardSetSchema,
  cardImageSchema,
  cardPriceSchema,
  cardVariantSchema,
  collectionPriceChangeHistorySchema,
  // averagedDataSchema,
  // chartDatasetEntrySchema,
  chartDataSchema,
  dataPointSchema,
  // lineStyleSchema,
  // statDataMapSchema,
  // collectionStatisticsSchema,
  createCommonFields,
  createSchemaWithCommonFields,
  // updateTotals,
};
