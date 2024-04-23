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
} = require('./schemas/CommonSchemas');
const logger = require('../configs/winston');
const { CardInCollection } = require('./Card');
const {
  updateCollectionStatistics,
  generateCardDataPoints,
  recalculatePriceHistory,
  processAndSortTimeData,
  aggregateAndValidateTimeRangeMap,
} = require('./utils/dataProcessing');
require('colors');

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
    collectionStatistics: collectionStatisticsSchema,
    latestPrice: priceEntrySchema,
    lastSavedPrice: priceEntrySchema,
    dailyCollectionPriceHistory: [priceEntrySchema],
    collectionPriceChangeHistory: [collectionPriceChangeHistorySchema],
    collectionPriceHistory: [priceEntrySchema],
    collectionValueHistory: [priceEntrySchema],
    nivoChartData: {
      type: Map,
      of: chartDataSchema,
    },
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
    selectedStatDataKey: {
      type: String,
      default: 'highpoint',
    },
    selectedColorDataKey: {
      type: String,
      default: 'blue',
    },
    newNivoChartData: [
      {
        id: String,
        color: String,
        data: [{ x: Date, y: Number }],
      },
    ],
    cards: [{ type: Schema.Types.ObjectId, ref: 'CardInCollection' }],
  },
  commonSchemaOptions,
);
CollectionSchema.pre('save', async function (next) {
  logger.info(`[Pre-save hook for collection:] ${this.name}`);
  try {
    // if (this.isNew) {
    // Initialize selectedChartData based on the key
    // const selectedData = this.averagedChartData.get(this.selectedChartDataKey);
    //   if (selectedData) {
    //     this.selectedChartData = selectedData;
    //   }
    // }
    const prevTotal = this.totalPrice;
    const prevQuantity = this.totalQuantity;
    let newTotalPrice = 0;
    let newTotalQuantity = 0;
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
        const cumulativeDataPoints = recalculatePriceHistory(cardDataPoints);
        this.collectionValueHistory = cumulativeDataPoints;
        const sortedData = processAndSortTimeData(cumulativeDataPoints);
        this.nivoChartData = sortedData;
        // Object.keys(sortedData).forEach((rangeKey, index) => {
        //   if (rangeKey && sortedData[rangeKey]) {
        //     // logger.info("[INFO] RANGE KEY: ", rangeKey);
        //     // logger.info(`[INFO][${index + 1}]: `.red, sortedData[rangeKey]);
        //     sortedData[rangeKey] = aggregateAndAverageData(sortedData[rangeKey]);
        //   }
        // });
        const safeAggregatedMap = aggregateAndValidateTimeRangeMap(sortedData);
        Object.entries(safeAggregatedMap).forEach(([key, value]) => {
          this.averagedChartData?.set(key, value);
        });
        // Object.entries(safeAggregatedMap).forEach(([key, value]) => {
        //   this.selectedChartData?.set(this.selectedChartDataKey, value);
        // });

        this.averagedChartData = safeAggregatedMap;
        // safeAggregatedMap.get will return undefined if the key is not found
        // this.selectedChartData = safeAggregatedMap[this.selectedChartDataKey];
        const nivoChartArray = Object.keys(safeAggregatedMap).map((key) => {
          return safeAggregatedMap[key];
        });

        this.newNivoChartData = nivoChartArray;
        this.selectedChartData = nivoChartArray[this.selectedChartDataKey];
      }
    }
    this.totalPrice = newTotalPrice;
    this.totalQuantity = newTotalQuantity;
    this.collectionStatistics = updateCollectionStatistics({
      newTotal: newTotalPrice,
      oldTotal: prevTotal,
      newQuantity: newTotalQuantity,
      oldQuantity: prevQuantity,
      oldHighPoint: this.collectionStatistics?.highPoint || 0,
      oldLowPoint: this.collectionStatistics?.lowPoint || 0,
      oldAvgPrice: this.collectionStatistics?.avgPrice || 0,
      oldPercentageChange: this.collectionStatistics?.percentageChange || 0,
    });

    this.lastUpdated = new Date();
    logger.info('[INFO][ 6 ]'.green, 'all values updated');
    this.markModified('totalPrice');
    this.markModified('totalQuantity');
    this.markModified('collectionPriceHistory');
    this.markModified('collectionValueHistory');
    this.markModified('nivoChartData');
    this.markModified('averagedChartData');
    this.markModified('selectedChartData');
    this.markModified('newNivoChartData');
    this.markModified('collectionStatistics');
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
