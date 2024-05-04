const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  cardImageSchema,
  cardPriceSchema,
  cardVariantSchema,
  cardSetSchema,
  dataPointSchema,
  chartDataSchema,
} = require('./schemas/CommonSchemas');
const logger = require('../configs/winston');
const moment = require('moment-timezone');
const { extendMoment } = require('moment-range');
const {
  generateSingleCardPriceEntries,
  createNewPriceEntry,
  convertToDataPoints,
  calculateValueHistory,
} = require('../utils/dateUtils');
const { blueLogBracks } = require('../utils/logUtils');

const momentWithRange = extendMoment(moment);
momentWithRange.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
const timezone = 'America/Seattle';
moment.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
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
const tag_Data = {
  tag: String, // AUTOSET: false
  watchlist: Boolean, // AUTOSET: false
  updatedFromCron: Boolean, // AUTOSET: false
};
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
const uniqueFields_Custom_Dynamic_Data = {
  latestPrice: priceEntrySchema, // AUTOSET: true
  lastSavedPrice: priceEntrySchema, // AUTOSET: true
  dailyPriceHistory: [priceEntrySchema], // AUTOSET: false
  priceHistory: [priceEntrySchema],
  valueHistory: [priceEntrySchema],
  priceChangeHistory: [dataPointSchema],
  allDataPoints: [dataPointSchema],
  // nivoChartData: {
  //   id: String,
  //   color: String,
  //   data: [{ x: Date, y: Number }],
  // },
};
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
const referenceSchema = new Schema({
  refId: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true },
});
const allRefsSchema = new Schema({
  decks: [referenceSchema],
  collections: [referenceSchema],
  carts: [referenceSchema],
  randomCards: {
    type: Map,
    of: referenceSchema,
  },
});
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
  averagedChartData: {
    type: Map,
    of: chartDataSchema,
  },
  price: Number, // AUTOSET: false
  quantity: Number, // AUTOSET: false
  totalPrice: { type: Number, default: 0 }, // AUTOSET: true
  addedAt: { type: Date }, // AUTOSET: true
  updatedAt: { type: Date }, // AUTOSET: true
});

const RandomCard = model('RandomCard', randomCardSchema);
const genericCardSchema = new Schema(
  {
    ...commonFields_API_Data,
    ...commonFields_Custom_Dynamic_Data,
    ...tag_Data,
    ...uniqueFields_Custom_Dynamic_Data,
    ...uniqueVariantFields,
    refs: allRefsSchema,
    dateAdded: { type: Date },
  },
  { timestamps: { createdAt: 'addedAt', updatedAt: 'updatedAt' } },
);
genericCardSchema.pre('save', async function (next) {
  logger.info(`[Pre-save hook for card: `.red + `${this.name}`.white + `]`.red);
  const now = moment().tz(timezone);
  logger.info(blueLogBracks(`CURRENT DATE: ${now}`));
  if (this.updatedFromCron) {
    logger.info(`[UPDATING CARD FROM CRON] `.green + `[${this.name}`.white + `]`.yellow);
    this.updatedFromCron = false;
  }
  if (this.isNew) {
    logger.info(`[NEW CARD] `.green + `[${this.name}`.white + `]`.green);
    this.addedAt = now;
    this.dateAdded = now;
    this.quantity = 1;
    this.lastSavedPrice = createNewPriceEntry(this.price); // Your existing function
    this.latestPrice = createNewPriceEntry(this.price); // Your existing function
    this.totalPrice = this.quantity * this.price;

    const newPriceEntry = generateSingleCardPriceEntries(this);
    const newDataPoints = convertToDataPoints([this]);
    this.valueHistory = [newPriceEntry];
    this.priceHistory = [newPriceEntry];
    this.allDataPoints = [newDataPoints];
    this.priceChangeHistory = [newDataPoints];
    logger.info(`[NEW DATAPOINT] `.green + `[${newDataPoints[0]}`.white);
  }
  if (!this.isNew) {
    logger.info(`[UPDATED CARD] `.blue + `[${this.name}`.white + `]`.blue);
    this.updatedAt = now;
    this.refId = this._id;
    const newDataPoints = generateSingleCardPriceEntries(this);
    this.priceHistory = newDataPoints;
    const newValueDataPoints = calculateValueHistory(newDataPoints);
    this.valueHistory = newValueDataPoints;
    const formattedDataPoints = convertToDataPoints(newValueDataPoints);
    this.allDataPoints = formattedDataPoints;
    this.totalPrice = this.quantity * this.price;
  }
  if (!this.priceChangeHistory) {
    this.priceChangeHistory = [];
    logger.info(`[PRICE CHANGE HISTORY REQUIRES ADD] `.red + `[${this.priceChangeHistory}`.white);
  }
  if (!this.priceHistory) {
    this.priceHistory = [];
    logger.info(`[PRICE HISTORY REQUIRES ADD] `.red + `[${this.priceHistory}`.white);
  }
  if (!this.valueHistory) {
    this.valueHistory = [];
    logger.info(`[VALUE HISTORY REQUIRES ADD] `.red + `[${this.valueHistory}`.white);
  }
  if (this.isModified('quantity')) {
    logger.info(`[NEW QUANTITY] ${this.quantity}`.green);
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
    logger.info(`[CARD PRICE MODIFIED] ${this.price}`.green); // this?.chart_datasets?.data?.push(
    this.lastSavedPrice = createNewPriceEntry(this.latestPrice.num, this.latestPrice.timestamp);
    this.latestPrice = createNewPriceEntry(this.price); // Your existing function
    const newDataPoints = convertToDataPoints([this]);
    this.priceChangeHistory = newDataPoints;
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
    'valueHistory',
  ];
  modifiedFields.forEach((field) => this.markModified(field));

  next();
});

const CardSet = model('CardSet', cardSetSchema);
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
