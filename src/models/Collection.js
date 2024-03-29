const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  collectionStatisticsSchema,
  chartDataSchema,
  updateTotals,
  createCommonFields,
  createSchemaWithCommonFields,
} = require("./schemas/CommonSchemas");

const { CardInCollection, CardInDeck, CardInCart } = require("./Card");
const logger = require("../configs/winston");
const {
  updateCollectionStatistics,
  generateCardDataPoints,
  aggregateAndValidateTimeRangeMap,
  processAndSortTimeData,
  recalculatePriceHistory,
  convertChartDataToArray,
  commonSchemaOptions,
} = require("./utils/dataProcessing");
const { infoLogger } = require("../middleware/loggers/logInfo");
require("colors");

const DeckSchema = createSchemaWithCommonFields("cards", "CardInDeck");
const CartSchema = createSchemaWithCommonFields("cart", "CardInCart");
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
    newNivoChartData: [
      {
        id: String,
        color: String,
        data: [{ x: Date, y: Number }],
      },
    ],
    cards: [{ type: Schema.Types.ObjectId, ref: "CardInCollection" }],
  },
  commonSchemaOptions
);
CollectionSchema.pre("save", async function (next) {
  infoLogger("Pre-save hook for collection:", this.name);
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

      this.averagedChartData = safeAggregatedMap;
      const nivoChartArray = convertChartDataToArray(this.averagedChartData);
      this.newNivoChartData = [nivoChartArray];
    }
  }
  this.totalPrice = newTotalPrice;
  this.totalQuantity = newTotalQuantity;
  this.collectionStatistics = updateCollectionStatistics(
    { ...this.collectionStatistics },
    newTotalPrice,
    newTotalQuantity
  );
  this.lastUpdated = new Date();
  logger.info("[INFO][ 6 ]".green, "all values updated");
  this.markModified("totalPrice");
  this.markModified("totalQuantity");
  this.markModified("collectionPriceHistory");
  this.markModified("collectionValueHistory");
  this.markModified("nivoChartData");
  this.markModified("averagedChartData");
  this.markModified("newNivoChartData");
  this.markModified("collectionStatistics");
  this.markModified("lastUpdated");

  next();
});

module.exports = {
  Deck: model("Deck", DeckSchema),
  Cart: model("Cart", CartSchema),
  Collection: model("Collection", CollectionSchema),
};
