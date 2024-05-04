// Require Mongoose
const mongoose = require('mongoose');
const logger = require('../../configs/winston');
const {
  Schema,
  Types: { Decimal128, ObjectId },
  model,
} = mongoose;
const { v4: uuidv4 } = require('uuid');

// Common schema types and options
const requiredString = { type: String, required: true };
const requiredDecimal128 = { type: Decimal128, required: true };
const commonSchemaOptions = { timestamps: true };

const requiredObjectId = (refPath) => ({ type: ObjectId, refPath, required: true });
const createReferenceFields = (enumOptions) => ({
  cardModel: { type: String, enum: enumOptions, required: true },
  cardId: { type: Schema.Types.ObjectId, refPath: 'cardModel', required: true },
});
const createPriceFields = () => ({
  cardmarket_price: Decimal128,
  tcgplayer_price: Decimal128,
  ebay_price: Decimal128,
  amazon_price: Decimal128,
  coolstuffinc_price: Decimal128,
});
const createImageFields = () => ({
  id: { type: Number },
  image_url: requiredString,
  image_url_small: String,
  image_url_cropped: String,
});
const createCardSetFields = () => ({
  set_name: String,
  set_code: requiredString,
  set_rarity: String,
  set_rarity_code: String,
  set_price: requiredDecimal128,
  ...createReferenceFields(['CardInCollection', 'CardInDeck', 'CardInCart']),
});
const createCardVariantFields = () => ({
  set_name: String,
  set_code: String,
  rarity: String,
  rarity_code: String,
  alt_art_image_url: String,
  price: { type: Decimal128, default: 0 },
  selected: { type: Boolean, default: false },
  set: requiredObjectId('CardSet'),
  ...createReferenceFields(['CardInCollection', 'CardInDeck', 'CardInCart']),
});
const createCollectionPriceChangesFields = () => ({
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
const createSchema = (fields, options = {}) =>
  new Schema(fields, { _id: false, ...options, ...commonSchemaOptions });
function arrayLimit(val) {
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
  const items = await cardModel.find({ _id: { $in: this[cardsField] } });
  items.forEach((item) => {
    this.totalPrice += item.price * item.quantity;
    this.totalQuantity += item.quantity;
  });
}
const createCommonFields = () => ({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  totalPrice: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
});
const createSchemaWithCommonFields = (cardsRef, schemaName, context) => {
  const schema = new Schema(
    {
      ...createCommonFields(),
      name: {
        type: String,
        required: true,
        default: `New ${context}`,
      },
      description: {
        type: String,
        required: true,
        default: `New ${context} description`,
      },
      [cardsRef]: [{ type: Schema.Types.ObjectId, ref: schemaName }],
      tags: {
        type: [
          {
            id: { type: String, default: uuidv4 },
            label: { type: String, default: 'defaultTag' },
          },
        ],
        default: [{}],
      },
      selectedTagValue: { type: String, default: 'defaultTag' },

      color: {
        type: String,
        enum: ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'],
        default: 'blue',
      },
    },
    commonSchemaOptions,
  );

  schema.pre('save', async function () {
    await updateTotals.call(this, model(schemaName), cardsRef);
  });

  return schema;
};
const priceEntrySchema = createSchema({ num: Number, timestamp: Date });
const cardImageSchema = createSchema(createImageFields());
const cardPriceSchema = createSchema(createPriceFields());
// const cardSetSchema = createSchema(createCardSetFields());
// cardSetSchema.index({ set_code: 1 }); // Index for performance
// const cardVariantSchema = createSchema(createCardVariantFields());
const collectionPriceChangeHistorySchema = createSchema(createCollectionPriceChangesFields());
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
// const cardImageSchema = createSchema({
//   id: { type: Number },
//   image_url: requiredString,
//   image_url_small: String,
//   image_url_cropped: String,
// });
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
    price: { type: Decimal128, default: 0 },
    selected: { type: Boolean, default: false },
    alt_art_image_url: String,
    set: requiredObjectId('CardSet'),
    ...createReferenceFields(['CardInCollection', 'CardInDeck', 'CardInCart']),
  },
  { timestamps: true },
);
// const collectionPriceChangeHistorySchema = new Schema({
//   timestamp: Date,
//   difference: Number,
//   priceChanges: [
//     {
//       timestamp: Date,
//       difference: Number,
//       collectionName: String,
//       cardName: String,
//       oldPrice: Number,
//       newPrice: Number,
//       priceDifference: Number,
//       message: String,
//     },
//   ],
// });
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
