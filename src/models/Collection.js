const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  collectionPriceHistorySchema,
  searchSessionSchema,
  collectionStatisticsSchema,
} = require("./CommonSchemas");
const { CardInCollection, CardInDeck, CardInCart } = require("./Card");
const {
  addHours,
  compareAsc,
  subDays,
  isWithinInterval,
  startOfHour,
  formatISO,
  differenceInHours,
} = require("date-fns");
const logger = require("../configs/winston");
const {
  updateCollectionStatistics,
  generateCardDataPoints,
  recalculatePriceHistory,
  processTimeSeriesData,
  processTimeData,
  sortDataIntoRanges,
  aggregateAndAverageData,
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
      of: new Schema({
        id: String,
        name: String,
        color: String,
        data: [
          {
            label: String,
            x: Date,
            y: Number,
          },
        ],
      }),
    },
    averagedChartData: {
      type: Map,
      of: new Schema({
        id: String,
        name: String,
        color: String,
        growth: Number,
        data: [
          {
            label: String,
            x: Date,
            y: Number,
          },
        ],
      }),
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
// CollectionSchema.pre("save", async function (next) {
//   console.log("Pre-save hook for collection:", this.name);
//   this.totalPrice = 0;
//   this.totalQuantity = 0;
//   this.collectionStatistics = updateCollectionStatistics(
//     this.collectionStatistics,
//     this.totalPrice,
//     this.totalQuantity
//   );

//   if (Array.isArray(this.cards) && this.cards.length > 0) {
//     const cardsInCollection = await CardInCollection.find({
//       _id: { $in: this.cards },
//     });

//     if (Array.isArray(cardsInCollection)) {
//       // Calculate total price and quantity from card data
//       cardsInCollection?.forEach((card) => {
//         this.totalQuantity += card.quantity;
//         this.totalPrice += card.price * card.quantity;
//       });

//       const cardDataPoints = generateCardDataPoints(cardsInCollection);
//       this.collectionPriceHistory = recalculatePriceHistory(cardDataPoints);
//       this.collectionValueHistory = processTimeSeriesData(
//         this?.collectionPriceHistory
//       );

//       const priceHistoryWithUpdatedLabels = processTimeData(
//         this.collectionValueHistory
//       );
//       const rawPriceHistoryMap = sortDataIntoRanges(
//         priceHistoryWithUpdatedLabels
//       );
//       this.nivoChartData = rawPriceHistoryMap;
//       Object.keys(this.nivoChartData || {})?.forEach((rangeKey) => {
//         if (rangeKey && this.nivoChartData[rangeKey]) {
//           logger.info(
//             "[INFO] RANGE KEY:",
//             rangeKey
//           );
//           this.averagedChartData[rangeKey] = aggregateAndAverageData(
//             this.nivoChartData[rangeKey]
//           );
//         }
//       });
//       logger.info(
//         "[INFO] Calculated price history for collection:",
//         priceHistoryWithUpdatedLabels
//       );

//       this.newNivoChartData = convertChartDataToArray(this?.averagedChartData);
//     }
//   }
//   this.collectionStatistics = updateCollectionStatistics(
//     this.collectionStatistics,
//     this.totalPrice,
//     this.totalQuantity
//   );

//   // Update and mark modified fields
//   [
//     "totalPrice",
//     "totalQuantity",
//     "collectionPriceHistory",
//     "collectionValueHistory",
//     "nivoChartData",
//     "averagedChartData",
//     "newNivoChartData",
//     "collectionStatistics",
//     "lastUpdated",
//   ].forEach((field) => this.markModified(field));

//   this.lastUpdated = new Date();
//   console.log("Updated collection statistics:", this.collectionStatistics);

//   next();
// });
CollectionSchema.pre("save", async function (next) {
  console.log("Pre-save hook for collection:", this.name);

  // Initialize new values without direct mutation
  let newTotalPrice = 0;
  let newTotalQuantity = 0;
  let newCollectionPriceHistory = [];
  let newCollectionValueHistory = []; // Assuming you meant to use this as well.
  let priceHistoryWithUpdatedLabels = [];
  let newNivoChartData = {};
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
      logger.info("[INFO][ 1 ] ".blue, cardDataPoints);
      // const newCollectionPriceHistory = recalculatePriceHistory([
      //   ...cardDataPoints,
      // ]);
      newCollectionPriceHistory = recalculatePriceHistory([...cardDataPoints]);
      logger.info("[INFO][ 2 ] ".blue, newCollectionPriceHistory);
      const priceHistoryWithUpdatedLabels = processTimeData([
        ...newCollectionPriceHistory,
      ]);
      logger.info("[INFO][ 3 ] ".blue, priceHistoryWithUpdatedLabels);
      let nivoChartData = sortDataIntoRanges({
        ...priceHistoryWithUpdatedLabels,
      });
      logger.info("[INFO][ 4 ] ".blue, nivoChartData);

      Object.keys(nivoChartData)?.forEach((rangeKey) => {
        if (rangeKey && nivoChartData[rangeKey]) {
          logger.info("[INFO] RANGE KEY:", rangeKey);
          nivoChartData[rangeKey] = aggregateAndAverageData(
            nivoChartData[rangeKey]
          );
        }
      });
      logger.info(
        "[INFO] Calculated price history for collection:",
        priceHistoryWithUpdatedLabels
      );
      this.averagedChartData = { ...nivoChartData };

      // Assign the processed data back to 'this'
      newNivoChartData = convertChartDataToArray(this?.averagedChartData);
      // this.newNivoChartData = convertChartDataToArray({ ...nivoChartData });
    }
  }

  // Updating 'this' with new values after all calculations
  this.totalPrice = newTotalPrice;
  this.totalQuantity = newTotalQuantity;
  this.collectionStatistics = updateCollectionStatistics(
    { ...this.collectionStatistics },
    newTotalPrice,
    newTotalQuantity
  );
  this.collectionPriceHistory = [
    ...(this.collectionPriceHistory || []),
    ...newCollectionPriceHistory,
  ];
  this.collectionValueHistory = [
    ...(this.collectionValueHistory || []),
    ...newCollectionValueHistory,
  ];
  this.nivoChartData = { ...newNivoChartData };
  this.lastUpdated = new Date();
  logger.info("[INFO][ 5 ] ".green, "all vals updated");

  // Ensure all relevant fields are marked as modified
  this.markModified("totalPrice");
  this.markModified("totalQuantity");
  this.markModified("collectionPriceHistory");
  this.markModified("collectionValueHistory");
  this.markModified("nivoChartData");
  this.markModified("averagedChartData");
  this.markModified("newNivoChartData");
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
// CollectionSchema.pre("save", async function (next) {
//   try {
//     console.log("pre save hook for collection", this.name);
//     this.totalPrice = 0;
//     this.totalQuantity = 0;
//     this.collectionStatistics = updateCollectionStatistics(
//       this.collectionStatistics,
//       this.totalPrice,
//       this.totalQuantity
//     );
//     this.nivoChartData = {
//       "24hr": {
//         id: "24hr",
//         name: "Last 24 Hours",
//         color: "#2e7c67",
//         data: [],
//       },
//       "7d": {
//         id: "7d",
//         name: "Last 7 Days",
//         color: "#2e7c67",
//         data: [],
//       },
//       "30d": {
//         id: "30d",
//         name: "Last 30 Days",
//         color: "#2e7c67",
//         data: [],
//       },
//       "90d": {
//         id: "90d",
//         name: "Last 90 Days",
//         color: "#2e7c67",
//         data: [],
//       },
//       "180d": {
//         id: "180d",
//         name: "Last 180 Days",
//         color: "#2e7c67",
//         data: [],
//       },
//       "270d": {
//         id: "270d",
//         name: "Last 270 Days",
//         color: "#2e7c67",
//         data: [],
//       },
//       "365d": {
//         id: "365d",
//         name: "Last 365 Days",
//         color: "#2e7c67",
//         data: [],
//       },
//     };
//     this.averagedChartData = {};
//     this.collectionPriceHistory = [];
//     this.collectionValueHistory = [];
//     if (this.cards && this.cards.length > 0) {
//       let cumulativePrice = 0;

//       const cardsInCollection = await CardInCollection.find({
//         _id: { $in: this.cards },
//       });

//       cardsInCollection.forEach((card) => {
//         this.totalQuantity += card.quantity;
//         card.priceHistory.forEach((priceEntry) => {
//           cumulativePrice += priceEntry.num;
//           this.collectionPriceHistory.push({
//             timestamp: priceEntry.timestamp,
//             num: priceEntry.num,
//           });
//         });
//       });
//       this.markModified("totalQuantity");
//       const newPriceHistory = generateCardDataPoints(cardsInCollection);
//       console.log("UPDATED HISTORY OF ALL CARDS PRICES ", newPriceHistory);
//       this.collectionPriceHistory = newPriceHistory;
//       this.markModified("collectionPriceHistory");
//       const newCumulativePriceHistory = recalculatePriceHistory(
//         this.collectionPriceHistory
//       );
//       console.log(
//         "UPDATED CUMULATIVE HISTORY OF ALL CARDS PRICES ",
//         newCumulativePriceHistory.slice(-25)
//       );
//       this.collectionValueHistory = newCumulativePriceHistory;
//       this.markModified("collectionValueHistory");
//       this.totalPrice =
//         this.collectionValueHistory[
//           this.collectionValueHistory.length - 1
//         ]?.num;
//       this.markModified("totalPrice");

//       const testFunc2 = processTimeSeriesData(newCumulativePriceHistory);
//       console.log("CURRENT ATTEMPT #2 24 HOUR CALC ", testFunc2);
//     }

//     const priceHistoryWithUpdatedLabels = processTimeData(
//       this.collectionValueHistory
//     );
//     // CREATE AN ARRAT OF VALUES FOR ONLY DATA FROM priceHistoryWithUpdatedLabels WHICH HAS A LABEL === '24h
//     const rawPriceHistoryMap = sortDataIntoRanges(
//       priceHistoryWithUpdatedLabels
//     );
//     this.nivoChartData = rawPriceHistoryMap;
//     this.markModified("nivoChartData");
//     Object.keys(rawPriceHistoryMap).forEach((rangeKey) => {
//       rawPriceHistoryMap[rangeKey] = aggregateAndAverageData(
//         rawPriceHistoryMap[rangeKey]
//       );
//     });
//     this.averagedChartData = rawPriceHistoryMap;
//     this.markModified("averagedChartData");
//     const updated = convertChartDataToArray(rawPriceHistoryMap);
//     this.newNivoChartData = updated;
//     this.markModified("newNivoChartData");

//     //! STEP FOUR: CALCULATE COLLECTION STATS
//     const updatedStats = updateCollectionStatistics(
//       this.collectionStatistics,
//       this.totalPrice,
//       this.totalQuantity
//     );
//     this.collectionStatistics = updatedStats;
//     this.markModified("collectionStatistics");

//     const now = new Date();
//     this.lastUpdated = now;
//     this.markModified("lastUpdated");
//     next();
//     console.log("pre save hook for collection", this.name);
//     console.log(this.collectionStatistics);

//     //! STEP FIVE: SAVE COLLECTION
//     // await this.save();
//   } catch (err) {
//     logger.error(`[ERROR] Collection pre-save hook: ${err}`);
//     next(err);
//   }
// });
// const DeckSchema = new Schema(
//   {
//     ...createCommonFields(),
//     name: String,
//     description: String,
//     tags: [String],
//     color: String,
//     cards: [{ type: Schema.Types.ObjectId, ref: "CardInDeck" }],
//   },
//   commonSchemaOptions
// );
// DeckSchema.pre("save", function (next) {
//   updateTotals.call(this, mongoose.model("CardInDeck"), "cards").then(next);
// });
// const CartSchema = new Schema(
//   {
//     ...createCommonFields(),
//     cart: [{ type: Schema.Types.ObjectId, ref: "CardInCart" }],
//   },
//   commonSchemaOptions
// );
// CartSchema.pre("save", function (next) {
//   updateTotals.call(this, mongoose.model("CardInCart"), "cart").then(next);
// });
