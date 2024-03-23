const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  collectionPriceHistorySchema,
  searchSessionSchema,
  collectionStatisticsSchema,
  chartDataSchema,
} = require("./CommonSchemas");

const { CardInCollection, CardInDeck, CardInCart } = require("./Card");
const logger = require("../configs/winston");
const {
  updateCollectionStatistics,
  generateCardDataPoints,
  aggregateAndValidateTimeRangeMap,
  processAndSortTimeData,
  recalculatePriceHistory,
  convertChartDataToArray,
} = require("./dataProcessing");
require("colors");
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
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  totalPrice: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
});
const createSchemaWithCommonFields = (cardsRef, schemaName) => {
  const schema = new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      totalPrice: { type: Number, default: 0 },
      totalQuantity: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 },
      name: String,
      description: String,
      [cardsRef]: [{ type: Schema.Types.ObjectId, ref: schemaName }],
      tags: {
        type: Array,
        default: [],
      },
      color: {
        type: String,
        enum: [
          "red",
          "orange",
          "yellow",
          "green",
          "teal",
          "blue",
          "purple",
          "pink",
        ],
        default: "teal",
      },
    },
    { timestamps: true }
  );

  schema.pre("save", async function (next) {
    await updateTotals.call(this, mongoose.model(schemaName), cardsRef);
    next();
  });

  return schema;
};
const commonSchemaOptions = { timestamps: true };

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
    dailyCollectionPriceHistory: [collectionPriceHistorySchema],
    collectionPriceHistory: [collectionPriceHistorySchema],
    collectionValueHistory: [collectionPriceHistorySchema],
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
  console.log("Pre-save hook for collection:", this.name);
  let newTotalPrice = 0;
  let newTotalQuantity = 0;
  if (Array.isArray(this.cards) && this.cards.length > 0) {
    const cardsInCollection = await CardInCollection.find({
      _id: { $in: this.cards.map((id) => id) },
    });

    if (Array.isArray(cardsInCollection) && cardsInCollection.length > 0) {
      // Accumulate total price and quantity without mutating 'this'
      cardsInCollection.forEach((card) => {
        newTotalQuantity += card.quantity;
        newTotalPrice += card.price * card.quantity;
      });

      const cardDataPoints = generateCardDataPoints([...cardsInCollection]);
      logger.info("[INFO][ 1 ][ collectionPriceHistory ]".blue, cardDataPoints);
      this.collectionPriceHistory = cardDataPoints;
      const cumulativeDataPoints = recalculatePriceHistory(cardDataPoints);
      logger.info(
        "[INFO][ 2 ][ collectionValueHistory ]".blue,
        cumulativeDataPoints
      );
      this.collectionValueHistory = cumulativeDataPoints;
      const sortedData = processAndSortTimeData(cumulativeDataPoints);
      logger.info("[INFO][ 3 ][ nivoChartData ]".blue, sortedData);
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
        this.averagedChartData.set(key, value);
      });

      logger.info("[INFO][ 4 ][ averagedChartData ]".blue, safeAggregatedMap);
      this.averagedChartData = safeAggregatedMap;
      const nivoChartArray = convertChartDataToArray(this.averagedChartData);
      logger.info("[INFO][ 5 ][ newNivoChartData ]".blue, nivoChartArray);
      newNivoChartData = nivoChartArray
    }
  }
  this.totalPrice = newTotalPrice;
  this.totalQuantity = newTotalQuantity;
  this.collectionStatistics = updateCollectionStatistics(
    { ...this.collectionStatistics },
    newTotalPrice,
    newTotalQuantity
  );
  // this.collectionPriceHistory = this.collectionPriceHistory
  //   ? [...this.collectionPriceHistory, ...newCollectionPriceHistory]
  //   : [...newCollectionPriceHistory];

  // this.collectionValueHistory = [
  //   ...(this.collectionValueHistory || []),
  //   ...newCollectionValueHistory,
  // ];
  // this.nivoChartData = { ...newNivoChartData };
  this.lastUpdated = new Date();
  logger.info("[INFO][ 5 ] ".green, "all vals updated");

  // Ensure all relevant fields are marked as modified
  this.markModified("totalPrice");
  this.markModified("totalQuantity");
  this.markModified("collectionPriceHistory");
  this.markModified("collectionValueHistory");
  this.markModified("nivoChartData");
  this.markModified("averagedChartData");
  // this.markModified("newNivoChartData");
  this.markModified("collectionStatistics");
  this.markModified("lastUpdated");

  console.log("Updated collection statistics:", this.collectionStatistics);

  next();
});

module.exports = {
  Deck: model("Deck", DeckSchema),
  Cart: model("Cart", CartSchema),
  Collection: model("Collection", CollectionSchema),
  SearchHistory: model(
    "SearchHistory",
    new Schema(
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        sessions: [searchSessionSchema],
        cards: [{ type: Schema.Types.ObjectId, ref: "CardInSearch" }],
      },
      { timestamps: true }
    )
  ),
};
