const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  cardImageSchema,
  cardPriceSchema,
  cardVariantSchema,
  cardSetSchema,
  averagedDataSchema,
  chartDatasetEntrySchema,
  dataPointSchema,
} = require('./schemas/CommonSchemas');
const logger = require('../configs/winston');
const moment = require('moment-timezone');
const { extendMoment } = require('moment-range');
const { generateSingleCardDataPoints, createNewPriceEntry } = require('../utils/dataUtils');

const momentWithRange = extendMoment(moment);
momentWithRange.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
const timezone = 'America/Seattle';
const now = momentWithRange().tz(timezone);
moment.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
// COMMON FIELD SCHEMAS: this data comes straight from the API
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
  watchlist: Boolean, // AUTOSET: false
};
// COMMON FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
// SAVE FUNCTION: fetchAndTransformCardData
const commonFields_Custom_Dynamic_Data = {
  price: Number, // AUTOSET: false
  quantity: Number, // AUTOSET: false
  image: String, // AUTOSET: true
  rarity: String,
  rarities: {
    type: Map,
    of: String,
  },
  sets: {
    type: Map,
    of: String,
  },
  totalPrice: { type: Number, default: 0 }, // AUTOSET: true
};
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
// SAVE FUNCTION: fetchAndTransformCardData
const uniqueFields_Custom_Dynamic_Data = {
  latestPrice: priceEntrySchema, // AUTOSET: true
  lastSavedPrice: priceEntrySchema, // AUTOSET: true
  priceHistory: [priceEntrySchema], // AUTOSET: true
  dailyPriceHistory: [priceEntrySchema], // AUTOSET: false
  priceChangeHistory: [
    {
      timestamp: Date,
      previousPrice: Number,
      updatedPrice: Number,
      priceDifference: Number,
      increased: Boolean,
      decreasded: Boolean,
    },
  ],
  chart_datasets: [chartDatasetEntrySchema],
  nivoChartData: {
    id: String,
    color: String,
    data: [{ x: Date, y: Number }],
  },
};
// UNIQUE FIELD SCHEMAS: this data is set initially by server (cardVariants) and then updated by user (variant), but the default value is automatically set to first cardVariant
// SAVE FUNCTION: fetchAndTransformCardData
const uniqueVariantFields = {
  cardVariants: [{ type: Schema.Types.ObjectId, ref: 'CardVariant' }], // Reference to CardSet
  cardModel: String, // AUTOSET: true
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
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
const referenceSchema = new Schema({
  refId: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true },
});
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
const allRefsSchema = new Schema({
  decks: [referenceSchema],
  collections: [referenceSchema],
  carts: [referenceSchema],
  randomCards: {
    type: Map,
    of: referenceSchema,
  },
});
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
const randomCardSchema = new Schema({
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
  image: String, // AUTOSET: false
  dailyPriceChange: Number,
  dailyPercentageChange: String,
  refs: allRefsSchema, // AUTOSET: false
  priceHistory: [priceEntrySchema],
  valueHistory: [priceEntrySchema],
  nivoValueHistory: [dataPointSchema],
  averagedChartData: {
    type: Map,
    of: averagedDataSchema,
  },
  nivoChartData: {
    id: String,
    color: String,
    data: [{ x: Date, y: Number }],
  },
  price: Number, // AUTOSET: false
  quantity: Number, // AUTOSET: false
  totalPrice: { type: Number, default: 0 }, // AUTOSET: true
  addedAt: { type: Date, default: Date.now }, // AUTOSET: true
  updatedAt: { type: Date, default: Date.now }, // AUTOSET: true
});

const RandomCard = model('RandomCard', randomCardSchema);
const RandomCardData = model('RandomCardData', randomCardSchema);
const genericCardSchema = new Schema(
  {
    ...commonFields_API_Data,
    ...commonFields_Custom_Dynamic_Data,
    ...commonFields_User_Input_Data,
    ...uniqueFields_Custom_Dynamic_Data,
    ...uniqueVariantFields,
    // Unified refs field to store all references
    refs: allRefsSchema,
    dateAdded: { type: Date },
  },
  { timestamps: { createdAt: 'addedAt', updatedAt: 'updatedAt' } },
);
genericCardSchema.pre('save', async function (next) {
  logger.info(`[Pre-save hook for card: `.red + `${this.name}`.white + `]`.red);
  if (this.isNew) {
    logger.info(`[NEW CARD] `.green + `[${this.name}`.white + `]`.green);
    this.addedAt = now.toDate();
    this.dateAdded = now.toDate();
    this.quantity = 1;
    this.lastSavedPrice = createNewPriceEntry(this.price); // Your existing function
    this.latestPrice = createNewPriceEntry(this.price); // Your existing function
    this.totalPrice = this.quantity * this.price;
    const newDataPoint = generateSingleCardDataPoints(this);
    logger.info(`[NEW DATAPOINT] `.green + `[${newDataPoint[0]}`.white);
  }
  if (!this.isNew) {
    logger.info(`[UPDATED CARD] `.blue + `[${this.name}`.white + `]`.blue);
    this.updatedAt = now.toDate();
    this.refId = this._id;
  }
  // if (!this.isModified('price') && !this.isModified('quantity')) return next();
  // if (!this.refId) {

  //   this.refId = this._id;
  // }
  if (!this.cardModel) {
    logger.info(`[MISSING MODEL REQUIRES SET] ${this.cardModel}`.red);
    this.cardModel = this.constructor.modelName;
  }
  if (!this.image) {
    logger.info(`[MISSING IMAGE REQUIRES SET] ${this.image}`.red);
    this.image = this.card_images[0]?.image_url || '';
  }
  if (!this.valueHistory) {
    logger.info(`[MISSING VALUE HISTORY REQUIRES SET] ${this.valueHistory}`.red);
    this.valueHistory = [];
  }
  if (this.isModified('quantity')) {
    logger.info(`QUANTITY MODIFIED] ${this.quantity}`.red);
    this.totalPrice = this.quantity * this.price;
    const valueEntry = createNewPriceEntry(this.totalPrice); // Your existing function
    this.valueHistory.push(valueEntry);
    const contextTypeMap = {
      CardInDeck: 'Deck',
      CardInCollection: 'Collection',
      CardInCart: 'Cart',
    };
    const cardContextKeys = Object.keys(contextTypeMap);
    const cardContextValues = Object.values(contextTypeMap);
    cardContextKeys.forEach((context) => {
      if (context === this.cardModel) {
        this.contextualQuantity[cardContextValues[context]] = this.quantity;
        this.contextualTotalPrice[cardContextValues[context]] = this.totalPrice;
      }
    });
  }
  if (this.isModified('price')) {
    logger.info(`[CARD PRICE MODIFIED] ${this.price}`.red); // this?.chart_datasets?.data?.push(
    this.lastSavedPrice = createNewPriceEntry(this.latestPrice); // Your existing function
    this.latestPrice = createNewPriceEntry(this.price); // Your existing function
    this.totalPrice = this.quantity * this.price;
    const valueEntry = createNewPriceEntry(this.totalPrice); // Your existing function
    this.valueHistory.push(valueEntry);
    const newPriceEntry = createNewPriceEntry(this.price); // Your existing function
    this.priceHistory.push(newPriceEntry);
  }
  if (this.isModified('watchlist')) {
    logger.info(`[WATCHLIST MODIFIED] ${this.watchlist}`.red); // this?.chart_datasets?.data?.push(
  }
  this.tag = '' || 'default';
  const modifiedFields = [
    'image',
    'latestPrice',
    'lastSavedPrice',
    'totalPrice',
    'priceHistory',
    'rarity',
    'price',
    'quantity',
    'tag',
    'watchlist',
    'cardModel',
    'cardVariants',
  ];
  modifiedFields.forEach((field) => this.markModified(field));

  next();
});

const CardSet = model('CardSet', cardSetSchema);
// const Variant = model('Variant', variantSchema);
const CardVariant = model('CardVariant', cardVariantSchema);
const CardInCollection = model('CardInCollection', genericCardSchema);
const CardInDeck = model('CardInDeck', genericCardSchema);
const CardInCart = model('CardInCart', genericCardSchema);

module.exports = {
  CardInCollection,
  CardInDeck,
  CardInCart,
  CardSet,
  CardVariant,
  RandomCard,
  RandomCardData,
};
// if (this.updateRefs) {
//   // Handle deck references
//   if (this.updateRefs.deckRefs) {
//     this.updateRefs.deckRefs.forEach((updateRef) => {
//       const index = this.deckRefs.findIndex((ref) => ref.deckId.equals(updateRef.deckId));
//       if (index > -1) {
//         // Update existing reference
//         this.deckRefs[index].quantity = updateRef.quantity;
//       } else {
//         // Add new reference
//         this.deckRefs.push(updateRef);
//       }
//     });
//   }

//   // Handle collection references
//   if (this.updateRefs.collectionRefs) {
//     this.updateRefs.collectionRefs.forEach((updateRef) => {
//       const index = this.collectionRefs.findIndex((ref) =>
//         ref.collectionId.equals(updateRef.collectionId),
//       );
//       if (index > -1) {
//         // Update existing reference
//         this.collectionRefs[index].quantity = updateRef.quantity;
//       } else {
//         // Add new reference
//         this.collectionRefs.push(updateRef);
//       }
//     });
//   }

//   // Handle cart references
//   if (this.updateRefs.cartRefs) {
//     this.updateRefs.cartRefs.forEach((updateRef) => {
//       const index = this.cartRefs.findIndex((ref) => ref.cartId.equals(updateRef.cartId));
//       if (index > -1) {
//         // Update existing reference
//         this.cartRefs[index].quantity = updateRef.quantity;
//       } else {
//         // Add new reference
//         this.cartRefs.push(updateRef);
//       }
//     });
//   }

//   // Clear the updateRefs to prevent reprocessing
//   this.updateRefs = null;
// }
// try {
//   await this.populate('variant');

//   // Set rarity after successful population
//   if (this.variant) {
//     this.rarity = this.variant.rarity;
//   } else {
//     logger.info(`[WARNING] Variant not populated for card: ${this.name}`);
//   }
// } catch (error) {
//   logger.info(`[GENERIC CARD: ${this.name}] PRE SAVE ERROR: `, error);
//   return next(error);
// }