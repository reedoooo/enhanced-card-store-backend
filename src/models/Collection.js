const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  chartDataSchema,
  createCommonFields,
  createSchemaWithCommonFields,
  collectionPriceChangeHistorySchema,
  commonSchemaOptions,
  dataPointSchema,
} = require('./schemas/CommonSchemas');
require('colors');
const logger = require('../configs/winston');
const { CardInCollection } = require('./Card');
const {
  convertToDataPoints,
  processDataForRanges,
  generateStatisticsForRanges,
  calculateValueHistory,
  createNewPriceEntry,
  generateCardDataPoints,
} = require('../utils/dateUtils.js');

const lineStyleSchema = new Schema(
  {
    stroke: { type: String, required: true },
    strokeWidth: { type: Number, required: true },
  },
  { _id: false },
);
const statDataMapSchema = new Schema({
  type: Map,
  of: {
    name: {
      type: String,
      enum: [
        'highPoint',
        'lowPoint',
        'average',
        'percentageChange',
        'priceChange',
        'avgPrice',
        'volume',
        'volatility',
      ],
      required: false,
    },
    id: { type: String, required: false },
    label: { type: String, required: false },
    statKey: { type: String, required: false },
    value: { type: Number, min: 0, required: false },
    color: { type: String, required: false },
    axis: { type: String, required: false },
    lineStyle: lineStyleSchema,
    legend: { type: String, required: false },
    legendOrientation: {
      type: String,
      required: false,
    },
  },
  _id: false,
});
const DeckSchema = createSchemaWithCommonFields('cards', 'CardInDeck', 'Deck');
const CartSchema = createSchemaWithCommonFields('items', 'CardInCart', 'Cart');
const CollectionSchema = new Schema(
  {
    ...createCommonFields(),
    name: String,
    description: String,
    dailyPriceChange: Number,
    dailyPercentageChange: String,
    newTotalPrice: Number,
    updatedFromCron: Boolean,
    dailyCollectionPriceHistory: [priceEntrySchema],
    collectionPriceChangeHistory: [collectionPriceChangeHistorySchema],
    latestPrice: priceEntrySchema,
    lastSavedPrice: priceEntrySchema,
    collectionPriceHistory: [priceEntrySchema],
    allDataPoints: [dataPointSchema],
    collectionValueHistory: [priceEntrySchema],
    averagedChartData: {
      type: Map,
      of: chartDataSchema,
    },
    selectedChartDataKey: {
      type: String,
      default: '24hr',
    },
    selectedChartData: {
      type: Object,
      default: {
        id: '24hr',
        color: 'blue',
        data: [{ x: Date, y: Number }],
        growth: 0,
      },
    },
    collectionStatistics: {
      type: Object,
      default: () => ({}),
    },
    collectionStatisticsAtRanges: new Schema({
      data: {
        type: Map,
        of: statDataMapSchema,
      },
    }),
    selectedStatDataKey: {
      type: String,
      default: 'highpoint',
    },
    selectedStatData: {
      type: Object,
      default: {
        id: 'highpoint',
        statKey: 'highPoint',
        label: '24 Hour Stats',
        color: '#FF8473',
        axis: 'y',
        lineStyle: { stroke: '#FF8473', strokeWidth: 2 },
        // VALUE TYPES: STRING, NUMBER, PERCENTAGE
        value: 0,
        legend: `High Point`,
        legendOrientation: 'vertical',
      },
    },
    selectedThemeDataKey: {
      type: String,
      default: 'blue',
    },
    selectedThemeData: {
      type: String,
      default: 'blue',
    },
    cards: [{ type: Schema.Types.ObjectId, ref: 'CardInCollection' }],
  },
  commonSchemaOptions,
);
CollectionSchema.pre('save', async function (next) {
  logger.info(`[Pre-save hook for collection: `.red + `${this.name}`.white + `]`.red);

  try {
    if (this.isNew) {
      logger.info(`[NEW COLLECTION] `.green + `[${this.name}`.white + `]`.green);
      const initPrice = this.cards[0]?.price ? this.cards[0]?.price : 0;
      const initPriceEntry = createNewPriceEntry(initPrice);
      this.addedAt = new Date();
      this.dateAdded = new Date();
      // this.collectionStatistics = new Map();
      this.selectedChartDataKey = '7d';
      this.selectedChartData = {
        id: '7d',
        color: 'blue',
        data: [{ x: Date, y: Number }],
        growth: 0,
      };
      this.selectedStatDataKey = 'highpoint';
      this.selectedStatData = {
        id: 'highpoint',
        statKey: 'highPoint',
        label: '24 Hour Stats',
        color: '#FF8473',
        axis: 'y',
        lineStyle: { stroke: '#FF8473', strokeWidth: 2 },
        // VALUE TYPES: STRING, NUMBER, PERCENTAGE
        value: 0,
        legend: `High Point`,
        legendOrientation:'vertical',
      };
      this.selectedThemeDataKey = 'blue';
      this.selectedThemeData = 'blue';
      this.dailyCollectionPriceHistory = [initPriceEntry];
      this.collectionPriceHistory = [initPriceEntry];
      this.collectionValueHistory = [initPriceEntry];
    }
    if (!this.isNew) {
      logger.info(`[UPDATING COLLECTION] `.blue + `[${this.name}`.white + `]`.blue);
    }
    if (this.updatedFromCron) {
      logger.info(`[UPDATED COLLECTION FROM CRON] `.green + `[${this.name}`.white + `]`.yellow);
      this.updatedFromCron = false;
    }
    // SET/RESET COLLECTION DATA AND DEFAULT VALUES
    let newTotalPrice = 0;
    let newTotalQuantity = 0;
    this.collectionPriceHistory = [];
    this.collectionValueHistory = [];
    this.dailyCollectionPriceHistory = [];
    this.allDataPoints = [];
    this.averagedChartData = new Map();
    this.collectionStatistics = {}
    if (Array.isArray(this.cards) && this.cards.length > 0) {
      const cardsInCollection = await CardInCollection.find({
        _id: { $in: this.cards.map((id) => id) },
      });
      if (Array.isArray(cardsInCollection) && cardsInCollection.length > 0) {
        cardsInCollection.forEach((card) => {
          newTotalQuantity += card.quantity;
          newTotalPrice += card.price * card.quantity;
        });
        const cardDataPoints = generateCardDataPoints([...cardsInCollection]);
        this.collectionPriceHistory = cardDataPoints;
        const cumulativeDataPoints = calculateValueHistory(cardDataPoints);
        this.collectionValueHistory = cumulativeDataPoints;
        const formattedDataPoints = convertToDataPoints(cumulativeDataPoints);
        this.allDataPoints = formattedDataPoints;
        const averageData = processDataForRanges(formattedDataPoints);
        this.averagedChartData = averageData;
        const generatedStatistics = generateStatisticsForRanges(
          formattedDataPoints,
          this.selectedChartDataKey,
          this.totalPrice,
          this.totalQuantity,
        );
        this.selectedChartData = averageData[this.selectedChartDataKey];
        for (const [key, value] of generatedStatistics.entries()) {
          this.collectionStatistics[key] = value;
        }
        this.selectedStatData = generatedStatistics[this.selectedStatDataKey];
        this.selectedThemeData = this.selectedThemeDataKey;
      }
    }
    this.totalPrice = newTotalPrice;
    this.totalQuantity = newTotalQuantity;
    this.lastUpdated = new Date();
    this.markModified('totalPrice');
    this.markModified('totalQuantity');
    this.markModified('collectionPriceHistory');
    this.markModified('collectionValueHistory');
    this.markModified('averagedChartData');
    this.markModified('selectedChartData');
    this.markModified('collectionStatistics');
    this.markModified('selectedStatData');
    this.markModified('collectionStatisticsAtRanges');
    this.markModified('lastUpdated');

    next();
  } catch (error) {
    logger.error(`[Error in pre-save hook] ${error.message}`);
    next(error); // Pass the error to Mongoose to handle it or abort save operation
  }
});

module.exports = {
  Deck: model('Deck', DeckSchema),
  Cart: model('Cart', CartSchema),
  Collection: model('Collection', CollectionSchema),
};
