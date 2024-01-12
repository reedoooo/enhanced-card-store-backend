const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  cardImageSchema,
  cardPriceSchema,
  chartDatasetsSchema,
  cardVariantSchema,
  cardSetSchema,
} = require('./CommonSchemas');
// COMMON FIELD SCHEMAS: this data comes straight from the API
// SAVE FUNCTION: fetchAndTransformCardData
const commonFields_API_Data = {
  name: { type: String, required: false }, // AUTOSET: false || required: true
  id: { type: String, required: false, unique: false }, // AUTOSET: false || required: true
  type: String, // AUTOSET: false
  frameType: String, // AUTOSET: false
  desc: String, // AUTOSET: false
  atk: Number, // AUTOSET: false
  def: Number, // AUTOSET: false
  level: Number, // AUTOSET: false
  race: String, // AUTOSET: false
  attribute: String, // AUTOSET: false
  archetype: [String], // AUTOSET: false
  card_sets: [{ type: Schema.Types.ObjectId, ref: 'CardSet' }], // Reference to CardSet
  card_images: [cardImageSchema], // AUTOSET: false
  card_prices: [cardPriceSchema], // AUTOSET: false
};
// COMMON FIELD SCHEMAS: this data is set by the user
// SAVE FUNCTION: fetchAndTransformCardData
const commonFields_User_Input_Data = {
  tag: String, // AUTOSET: false
  watchList: Boolean, // AUTOSET: false
};
// COMMON FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
// SAVE FUNCTION: fetchAndTransformCardData
const commonFields_Custom_Dynamic_Data = {
  price: Number, // AUTOSET: false
  quantity: Number, // AUTOSET: false
  image: String, // AUTOSET: true
  totalPrice: { type: Number, default: 0 }, // AUTOSET: true
};
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
// SAVE FUNCTION: fetchAndTransformCardData
const uniqueFields_Custom_Dynamic_Data = {
  latestPrice: priceEntrySchema, // AUTOSET: true
  lastSavedPrice: priceEntrySchema, // AUTOSET: true
  priceHistory: [priceEntrySchema], // AUTOSET: true
  dailyPriceHistory: [priceEntrySchema], // AUTOSET: false
  chart_datasets: [chartDatasetsSchema], // AUTOSET: false
};
// UNIQUE FIELD SCHEMAS: this data is set initially by server (cardVariants) and then updated by user (variant), but the default value is automatically set to first cardVariant
// SAVE FUNCTION: fetchAndTransformCardData
const uniqueVariantFields = {
  // cardVariants: [cardVariantSchema], // AUTOSET: false
  cardVariants: [{ type: Schema.Types.ObjectId, ref: 'CardVariant' }], // Reference to CardSet
  variant: { type: Schema.Types.ObjectId, ref: 'CardVariant' }, // Reference to CardSet
  rarity: String, // AUTOSET: true
  contextualQuantity: {
    SearchHistory: Number,
    Deck: Number,
    Collection: Number,
    Cart: Number,
  }, // AUTOSET: true
  contextualTotalPrice: {
    SearchHistory: Number,
    Deck: Number,
    Collection: Number,
    Cart: Number,
  }, // AUTOSET: true
};

// Generic Card Schema
const genericCardSchema = new Schema(
  {
    ...commonFields_API_Data,
    ...commonFields_Custom_Dynamic_Data,
    ...commonFields_User_Input_Data,
    ...uniqueFields_Custom_Dynamic_Data,
    ...uniqueVariantFields,
    // ! ---------- card identification fields ----------
    refId: { type: Schema.Types.ObjectId, refPath: 'cardModel' },
    cardModel: {
      type: String,
      enum: ['CardInSearch', 'CardInCollection', 'CardInDeck', 'CardInCart'],
    },
    collectionId: { type: Schema.Types.ObjectId, refPath: 'collectionModel' },
    collectionModel: {
      type: String,
      enum: ['SearchHistory', 'Collection', 'Deck', 'Cart'],
    },
  },
  { timestamps: { createdAt: 'addedAt', updatedAt: 'updatedAt' } },
);

// Middleware for genericCardSchema
genericCardSchema.pre('save', async function (next) {
  if (!this.refId) {
    this.refId = this._id; // Set the refId to the document's _id
  }
  if (!this.cardModel) {
    this.cardModel = this.constructor.modelName; // Set the cardModel to the document's modelName
  }

  // Check for empty or null fields, ignoring 'tag' and 'rarity' fields
  const fieldsToCheck = Object.keys(this.toObject()).filter(
    (field) => field !== 'tag' && field !== 'rarity',
  );
  fieldsToCheck.forEach((field) => {
    if (this[field] === null || this[field] === '') {
      console.log(
        `[PRE-SAVE CHECK] Field '${field}' is empty or null. Current value:`,
        this[field],
      );
    }
  });

  try {
    // Other pre-save logic here
    next();
  } catch (error) {
    console.log(`[GENERIC CARD: ${this.name}]`.red + ' PRE SAVE ERROR: ', error);
    next(error);
  }
});

const CardSet = model('CardSet', cardSetSchema);
const CardVariant = model('CardVariant', cardVariantSchema);
const CardInCollection = mongoose.model('CardInCollection', genericCardSchema);
const CardInDeck = mongoose.model('CardInDeck', genericCardSchema);
const CardInCart = mongoose.model('CardInCart', genericCardSchema);
const CardInSearch = mongoose.model('CardInSearch', genericCardSchema);

module.exports = {
  CardInCollection,
  CardInDeck,
  CardInCart,
  CardInSearch,
  CardSet,
  CardVariant,
};
