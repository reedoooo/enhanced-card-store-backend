const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  cardImageSchema,
  cardPriceSchema,
  chartDatasetsSchema,
  cardVariantSchema,
  cardSetSchema,
  // variantSchema,
} = require('./CommonSchemas');
const createNewPriceEntry = (price) => {
  return {
    num: price,
    date: new Date(),
  };
};
function calculateContextualQuantity(card, context) {
  // Logic to calculate the quantity of card in a specific context (SearchHistory, Deck, etc.)
  // Return the calculated quantity for the given context
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
  // variant: { type: Schema.Types.ObjectId, ref: 'Variant' }, // AUTOSET: true
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
    this.refId = this._id;
  }
  if (!this.cardModel) {
    this.cardModel = this.constructor.modelName;
  }
  if (!this.image) {
    this.image = this.card_images[0].image_url;
  }

  // Ensure variant is set to a valid ID from cardVariants
  if (this.cardVariants && this.cardVariants.length > 0) {
    const variantIsInCardVariants = this.cardVariants.includes(this.variant);
    if (!this.variant || !variantIsInCardVariants) {
      this.variant = this.cardVariants[0];
    }
  } else {
    // If no variants available, log and skip setting rarity
    console.log(`[WARNING] No variants available for card: ${this.name}`);
    return next();
  }

  // SECTION FOR VALUES THAT ARE UPDATED AND SET BY THE SERVER
  // Calculate totalPrice based on quantity and latestPrice
  // TODO: this is a temporary fix to prevent latestPrice from being set to 0, but ill create funtion for getting it and handle it later
  if (this.isModified('quantity')) {
    this.latestPrice = createNewPriceEntry(this.price);
    this.lastSavedPrice = createNewPriceEntry(this.price);
    this.totalPrice = this.quantity * this.price;
    this.priceHistory.push(createNewPriceEntry(this.totalPrice));

    // Update contextual quantities and total prices
    const contextKeys = ['SearchHistory', 'Deck', 'Collection', 'Cart'];
    contextKeys.forEach((context) => {
      this.contextualQuantity[context] = calculateContextualQuantity(this, context);
      this.contextualTotalPrice[context] = this.contextualQuantity[context] * this.price;
    });
  }
  // Populate the variant field
  try {
    await this.populate('variant');

    // Set rarity after successful population
    if (this.variant) {
      this.rarity = this.variant.rarity;
    } else {
      console.log(`[WARNING] Variant not populated for card: ${this.name}`);
    }
  } catch (error) {
    console.log(`[GENERIC CARD: ${this.name}] PRE SAVE ERROR: `, error);
    return next(error);
  }

  next();
});

const CardSet = model('CardSet', cardSetSchema);
// const Variant = model('Variant', variantSchema);
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
