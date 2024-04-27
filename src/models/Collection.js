const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  collectionStatisticsSchema,
  chartDataSchema,
  updateTotals,
  createCommonFields,
  createSchemaWithCommonFields,
  collectionPriceChangeHistorySchema,
  commonSchemaOptions,
  dataPointSchema,
} = require('./schemas/CommonSchemas');
require('colors');

const logger = require('../configs/winston');
const { CardInCollection } = require('./Card');
const { generateCardDataPoints, recalculatePriceHistory } = require('../utils/dataUtils.js');
const {
  convertToDataPoints,
  processDataForRanges,
  generateStatisticsForRanges,
} = require('../utils/dateUtils.js');
const { validate } = require('node-cron');

const DeckSchema = createSchemaWithCommonFields('cards', 'CardInDeck');
const CartSchema = createSchemaWithCommonFields('items', 'CardInCart');
const CollectionSchema = new Schema(
  {
    ...createCommonFields(),
    name: String,
    description: String,
    dailyPriceChange: Number,
    dailyPercentageChange: String,
    newTotalPrice: Number,

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
      type: Map,
      of: collectionStatisticsSchema,
      default: () =>
        new Map([
          [
            '24hr',
            {
              id: '24hr',
              name: '24 Hour Stats',
              color: 'blue',
              data: new Map([
                [
                  'highPoint',
                  {
                    name: 'highPoint',
                    label: 'High Point',
                    color: '#FF8473',
                    axis: 'y',
                    lineStyle: { stroke: '#FF8473', strokeWidth: 2 },
                    value: 0,
                    legend: 'High Point',
                    legendOrientation: 'vertical',
                  },
                ],
              ]),
            },
          ],
        ]),
    },
    selectedStatDataKey: {
      type: String,
      default: 'highpoint',
    },
    selectedStat: {
      type: Object,
      default: {
        id: 'highpoint',
        key: 'highPoint',
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
    selectedColorDataKey: {
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
    if (Array.isArray(this.cards) && this.cards.length > 0) {
      let newTotalPrice = 0;
      let newTotalQuantity = 0;
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
        const cumulativeDataPoints = recalculatePriceHistory(cardDataPoints);
        this.collectionValueHistory = cumulativeDataPoints;
        const formattedDataPoints = convertToDataPoints(cumulativeDataPoints);
        this.allDataPoints = formattedDataPoints;
        const averageData = processDataForRanges(formattedDataPoints);
        this.averagedChartData = averageData;
      }
      this.totalPrice = newTotalPrice;
      this.totalQuantity = newTotalQuantity;
      const generatedStatistics = generateStatisticsForRanges(this.allDataPoints);
      if (generatedStatistics instanceof Map) {
        logger.info(`[GENERATED STATISTICS] ${generatedStatistics.get('24hr')}`);
        this.collectionStatistics = generatedStatistics;
      } else {
        logger.error('[INVALID TYPE] Expected a Map object.');
      }
      generatedStatistics.forEach((value, key) => {
        if (typeof key !== 'string') {
          logger.error(`Invalid key for key ${key}: Expected a string.`);
        }
        if (typeof value !== 'object') {
          logger.error(`Invalid value for key ${key}: Expected an object.`);
        }
      });
      // this.collectionStatistics = generatedStatistics;
      // const statsAtSelectedTimeRange = this.collectionStatistics.get(this.selectedChartDataKey);
      // if (statsAtSelectedTimeRange) {
      //   logger.info(
      //     `[STATS FOUND AT RANGE: ${this.selectedChartDataKey}][${statsAtSelectedTimeRange.name}]`
      //       .green,
      //   );
      //   const selectedStatData = statsAtSelectedTimeRange.data.get(this.selectedStatDataKey);
      //   if (selectedStatData) {
      //     logger.info(
      //       `[SELECTED STAT DATA FOUND: ${this.selectedStatDataKey}][${selectedStatData.name}]`
      //         .green,
      //     );
      //     this.selectedStat = selectedStatData;
      //   } else {
      //     logger.error('Selected stat data key not found.');
      //   }
      // } else {
      //   logger.error('Selected chart data key not found.');
      // }
    }

    this.lastUpdated = new Date();
    logger.info('[INFO][ 6 ]'.green, 'all values updated');
    this.markModified('totalPrice');
    this.markModified('totalQuantity');
    this.markModified('collectionPriceHistory');
    this.markModified('collectionValueHistory');
    // this.markModified('nivoChartData');
    // this.markModified('averagedChartData');
    this.markModified('selectedChartData');
    // this.markModified('newNivoChartData');
    // this.markModified('collectionStatistics');
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
