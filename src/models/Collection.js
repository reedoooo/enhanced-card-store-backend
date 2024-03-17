const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  collectionPriceHistorySchema,
  searchSessionSchema,
  dataPointSchema,
  collectionPriceChangeHistorySchema,
  collectionStatisticsSchema,
  nivoChartSchema,
} = require("./CommonSchemas");
const { CardInCollection, CardInDeck, CardInCart } = require("./Card");
const { isValid, parseISO, format } = require("date-fns");
const logger = require("../configs/winston");
require("colors");
const createCommonFields = () => ({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  totalPrice: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
});
async function updateTotals(cardModel, cardsField) {
  this.totalPrice = 0;
  this.totalQuantity = 0;
  if (this[cardsField] && this[cardsField].length > 0) {
    const items = await cardModel.find({ _id: { $in: this[cardsField] } });
    for (const item of items) {
      this.totalPrice += item.price * item.quantity;
      this.totalQuantity += item.quantity;
    }
  }
}
const commonSchemaOptions = { timestamps: true };
const DeckSchema = new Schema(
  {
    ...createCommonFields(),
    name: String,
    description: String,
    tags: [String],
    color: String,
    cards: [{ type: Schema.Types.ObjectId, ref: "CardInDeck" }],
  },
  commonSchemaOptions
);
DeckSchema.pre("save", function (next) {
  updateTotals.call(this, mongoose.model("CardInDeck"), "cards").then(next);
});
const CartSchema = new Schema(
  {
    ...createCommonFields(),
    cart: [{ type: Schema.Types.ObjectId, ref: "CardInCart" }],
  },
  commonSchemaOptions
);
CartSchema.pre("save", function (next) {
  updateTotals.call(this, mongoose.model("CardInCart"), "cart").then(next);
});
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
    nivoTestData: {
      type: Map,
      of: new Schema({
        id: String,
        color: String,
        data: [{ x: Date, y: Number }],
      }),
    },
    muiChartData: [
      {
        id: String,
        value: Number,
        label: String,
        color: String,
      },
    ],
    chartData: {
      name: String,
      allXYValues: [{ label: String, x: Date, y: Number }],
    },
    cards: [{ type: Schema.Types.ObjectId, ref: "CardInCollection" }],
  },
  commonSchemaOptions
);
function processTimeData(dataArray) {
  const now = new Date();
  return dataArray.map((item) => {
    const itemDate = new Date(item.timestamp);
    const diffDays = (now - itemDate) / (1000 * 3600 * 24);
    let label;

    if (diffDays <= 1) {
      label = "24hr";
    } else if (diffDays <= 30) {
      label = "30d";
    } else if (diffDays <= 90) {
      label = "90d";
    } else if (diffDays <= 180) {
      label = "180d";
    } else if (diffDays <= 270) {
      label = "270d";
    } else if (diffDays <= 365) {
      label = "365d";
    } else {
      label = "365d+"; // Consider data older than 365 days
    }

    return {
      x: itemDate.toISOString(),
      y: item.num,
      label: label,
    };
  });
}
// ! CRUCIAL: SORTS DATA INTO RANGES
function sortDataIntoRanges(processedData) {
  let nivoChartData = {
    "24hr": {
      id: "24hr",
      name: "Last 24 Hours",
      color: "#2e7c67",
      data: [],
    },
    "7d": {
      id: "7d",
      name: "Last 7 Days",
      color: "#2e7c67",
      data: [],
    },
    "30d": {
      id: "30d",
      name: "Last 30 Days",
      color: "#2e7c67",
      data: [],
    },
    "90d": {
      id: "90d",
      name: "Last 90 Days",
      color: "#2e7c67",
      data: [],
    },
    "180d": {
      id: "180d",
      name: "Last 180 Days",
      color: "#2e7c67",
      data: [],
    },
    "270d": {
      id: "270d",
      name: "Last 270 Days",
      color: "#2e7c67",
      data: [],
    },
    "365d": {
      id: "365d",
      name: "Last 365 Days",
      color: "#2e7c67",
      data: [],
    },
  };

  processedData.forEach((item) => {
    // Use an array to keep track of which ranges the item should be added to
    const applicableRanges = [];

    // Determine the applicable ranges based on the item's label
    switch (item.label) {
      case "24hr":
        applicableRanges.push(
          "24hr",
          "7d",
          "30d",
          "90d",
          "180d",
          "270d",
          "365d"
        );
        break;
      case "7d":
        applicableRanges.push("7d", "30d", "90d", "180d", "270d", "365d");
        break;
      case "30d":
        applicableRanges.push("30d", "90d", "180d", "270d", "365d");
        break;
      case "90d":
        applicableRanges.push("90d", "180d", "270d", "365d");
        break;
      case "180d":
        applicableRanges.push("180d", "270d", "365d");
        break;
      case "270d":
        applicableRanges.push("270d", "365d");
        break;
      case "365d":
        applicableRanges.push("365d");
        break;
    }

    // For each applicable range, add the item to that range's data
    applicableRanges.forEach((range) => {
      nivoChartData[range].data.push({ x: item.x, y: item.y });
    });
  });

  return nivoChartData;
}
// ! CRUCIAL: AGGREGATES AND AVERAGES DATA WITHIN RANGES
function aggregateAndAverageData(chart) {
  const clusterCounts = {
    "24hr": 24,
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "180d": 180,
    "270d": 270,
    "365d": 365,
  };

  const rangeKey = chart.id;
  const numClusters = clusterCounts[rangeKey];
  let processedData = [];

  if (chart.data.length === 0) {
    // Handle the case with no initial data
    const now = new Date();
    for (let i = 0; i < numClusters; i++) {
      let newTimestamp = new Date();
      if (rangeKey === "24hr") {
        newTimestamp.setHours(now.getHours() - (24 - i), 0, 0, 0);
      } else {
        newTimestamp.setDate(now.getDate() - (numClusters - i));
      }
      processedData.push({ x: newTimestamp.toISOString(), y: 0 });
    }
  } else {
    const sortedData = chart.data.sort((a, b) => new Date(a.x) - new Date(b.x));
    if (rangeKey === "24hr") {
      // Initialize an array to keep track of hourly values
      processedData = new Array(24).fill(null).map((_, index) => {
        let dataHour = new Date(sortedData[0].x);
        dataHour.setHours(dataHour.getHours() + index, 0, 0, 0);
        return { x: dataHour.toISOString(), y: null };
      });

      // Iterate over the sorted data to fill the processedData with the latest values
      sortedData.forEach((dataPoint) => {
        let dataPointHour = new Date(dataPoint.x).getHours();
        processedData[dataPointHour].y = dataPoint.y;
      });

      // Forward fill the processedData to ensure all nulls are replaced with the last known value
      let lastKnownValue = 0;
      processedData.forEach((data, index) => {
        if (data.y !== null) {
          lastKnownValue = data.y;
        } else {
          processedData[index].y = lastKnownValue;
        }
      });
    } else {
      // Initialize processedData for daily granularity
      processedData = new Array(numClusters).fill(null).map((_, index) => {
        let dataDay = new Date(sortedData[0].x);
        dataDay.setDate(dataDay.getDate() + index);
        return { x: dataDay.toISOString(), y: null };
      });

      // Populate with known values and apply forward filling
      sortedData.forEach((dataPoint) => {
        let dataPointIndex = Math.floor(
          (new Date(dataPoint.x) - new Date(sortedData[0].x)) /
            (24 * 3600 * 1000)
        );
        if (dataPointIndex < numClusters) {
          processedData[dataPointIndex].y = dataPoint.y;
        }
      });

      let lastKnownDailyValue = 0;
      processedData.forEach((data, index) => {
        if (data.y !== null) {
          lastKnownDailyValue = data.y;
        } else {
          processedData[index].y = lastKnownDailyValue;
        }
      });
    }
  }

  return {
    id: chart.id,
    name: chart.name,
    color: chart.color,
    data: processedData.filter((data) => data.y !== null),
  };
}
//! CRUCIAL: CONVERT NIVO CHART DATA TO ARRAY
function convertChartDataToArray(averagedChartData) {
  return Object.values(averagedChartData);
}
// ! CRUCIAL: UPDATE COLLECTION STATISTICS
function updateCollectionStatistics(currentStats, totalPrice, totalQuantity) {
  const updatedStats = {
    highPoint: Math.max(currentStats.highPoint, totalPrice),
    lowPoint: Math.min(currentStats.lowPoint, totalPrice), // Should this be totalPrice instead of 0 to make sense?
    avgPrice: totalQuantity > 0 ? totalPrice / totalQuantity : 0,
    priceChange: totalPrice - (currentStats.highPoint || 0),
    percentageChange: 0,
  };
  updatedStats.percentageChange =
    updatedStats.lowPoint !== 0
      ? (updatedStats.priceChange / updatedStats.lowPoint) * 100
      : 0;

  return updatedStats;
}
function calculateAccumulatedPriceHistoryData(rawData) {
  let totalValue = 0;
  return rawData.map((point) => {
    totalValue += point.num;
    return { ...point, num: totalValue };
  });
}
function formatPoint(timestamp, num) {
  return { x: timestamp, y: num };
}
function generateCardDataPoints(cards) {
  // Sort cards by addedAt timestamp
  const sortedCards = cards.sort(
    (a, b) => new Date(a.addedAt) - new Date(b.addedAt)
  );

  let dataPoints = [];

  sortedCards.forEach((card) => {
    // Extract necessary details from each card
    const { price, quantity, addedAt } = card;
    let timestamp = new Date(addedAt);

    // Generate data points for each quantity of the card
    for (let i = 0; i < quantity; i++) {
      dataPoints.push({
        num: price,
        timestamp: timestamp.toISOString(),
      });
      // Increment timestamp by 1 hour for the next quantity of the same card
      timestamp = new Date(timestamp.getTime() + 60 * 60 * 1000);
    }
  });

  return dataPoints;
}
function recalculatePriceHistory(cardDataPoints) {
  let priceHistory = [];
  let totalValue = 0;

  // Increment the total value for each data point
  cardDataPoints?.forEach((dataPoint) => {
    totalValue += dataPoint.num;
    priceHistory.push({
      num: totalValue,
      timestamp: dataPoint.timestamp,
    });
  });

  return priceHistory;
}
const formatDate = (dateInput) => {
  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  }

  if (date && !isNaN(date)) {
    return date.toISOString();
  } else {
    return "Invalid Date";
  }
};

const processTimeRanges = (history, hoursAgo) => {
  const now = new Date();

  // Filter history items based on their timestamps being within the last 'hoursAgo' hours
  return history
    .filter((item) => {
      const itemDate = new Date(item.timestamp);
      // Calculate the difference in hours between now and the item's timestamp
      const diffHours = (now - itemDate) / (1000 * 3600);

      // Include only those items where the difference is less than the specified 'hoursAgo'
      return diffHours < hoursAgo;
    })
    .map((item) => {
      // After filtering, map the item to the required structure
      return {
        x: item.timestamp, // Assuming ISO string conversion if needed elsewhere
        y: item.num,
        label: "24hr", // Since all filtered items are within the last 24 hours
      };
    });
};

function generate24hDataPoints(arrayOf24HourData) {
  // Assuming arrayOf24HourData is already sorted and formatted correctly.

  console.log("Input Data Points for Last 24 Hours:", arrayOf24HourData);
  arrayOf24HourData.forEach((dataPoint, index) => {
    console.log(
      `${index + 1}: Timestamp: ${dataPoint.x}, Value: ${dataPoint.y}`
    );
  });

  // Verify the data points cover the 24-hour range; otherwise, the logic needs adjustments.
  const now = new Date();
  const startTimestamp = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  let hourlyDataPoints = [];

  for (let i = 0; i < 24; i++) {
    // Calculate the expected timestamp for this hour
    let expectedHourTimestamp = new Date(
      startTimestamp.getTime() + i * 60 * 60 * 1000
    );

    // Find or default to the corresponding point in arrayOf24HourData
    let correspondingDataPoint = arrayOf24HourData.find(
      (point) =>
        new Date(point.x).getHours() === expectedHourTimestamp.getHours()
    );

    if (correspondingDataPoint) {
      hourlyDataPoints.push(correspondingDataPoint);
    } else {
      // If there is no direct match, default to the last known value or 0 if none is known
      let lastKnownValue =
        hourlyDataPoints.length > 0
          ? hourlyDataPoints[hourlyDataPoints.length - 1].y
          : 0;
      hourlyDataPoints.push({
        x: expectedHourTimestamp.toISOString(),
        y: lastKnownValue,
      });
    }
  }

  return hourlyDataPoints;
}

CollectionSchema.pre("save", async function (next) {
  try {
    console.log("pre save hook for collection", this.name);
    this.totalPrice = 0;
    this.totalQuantity = 0;
    this.collectionStatistics = {
      highPoint: 0,
      lowPoint: Infinity,
      avgPrice: 0,
      percentageChange: 0,
      priceChange: 0,
    };
    this.nivoChartData = {
      "24hr": {
        id: "24hr",
        name: "Last 24 Hours",
        color: "#2e7c67",
        data: [],
      },
      "7d": {
        id: "7d",
        name: "Last 7 Days",
        color: "#2e7c67",
        data: [],
      },
      "30d": {
        id: "30d",
        name: "Last 30 Days",
        color: "#2e7c67",
        data: [],
      },
      "90d": {
        id: "90d",
        name: "Last 90 Days",
        color: "#2e7c67",
        data: [],
      },
      "180d": {
        id: "180d",
        name: "Last 180 Days",
        color: "#2e7c67",
        data: [],
      },
      "270d": {
        id: "270d",
        name: "Last 270 Days",
        color: "#2e7c67",
        data: [],
      },
      "365d": {
        id: "365d",
        name: "Last 365 Days",
        color: "#2e7c67",
        data: [],
      },
    };
    this.averagedChartData = {};
    this.collectionPriceHistory = [];
    if (this.cards && this.cards.length > 0) {
      let cumulativePrice = 0;

      const cardsInCollection = await CardInCollection.find({
        _id: { $in: this.cards },
      });

      cardsInCollection.forEach((card) => {
        this.totalQuantity += card.quantity;
        card.priceHistory.forEach((priceEntry) => {
          cumulativePrice += priceEntry.num;
          this.collectionPriceHistory.push({
            timestamp: priceEntry.timestamp,
            num: priceEntry.num,
          });
        });
      });
      this.markModified("totalQuantity");
      const newPriceHistory = generateCardDataPoints(cardsInCollection);
      console.log("UPDATED HISTORY OF ALL CARDS PRICES ", newPriceHistory);
      this.collectionPriceHistory = newPriceHistory;
      this.markModified("collectionPriceHistory");
      const newCumulativePriceHistory = recalculatePriceHistory(
        this.collectionPriceHistory
      );
      console.log(
        "UPDATED CUMULATIVE HISTORY OF ALL CARDS PRICES ",
        newCumulativePriceHistory.slice(-25)
      );
      this.collectionValueHistory = newCumulativePriceHistory;
      this.markModified("collectionValueHistory");
      this.totalPrice =
        this.collectionValueHistory[
          this.collectionValueHistory.length - 1
        ]?.num;
      this.markModified("totalPrice");

      const dataPoints24h = generate24hDataPoints(this.collectionValueHistory);
      console.log("CURRENT ATTEMPTVAT 24 HOUR CALC ", dataPoints24h);
    }

    const priceHistoryWithUpdatedLabels = processTimeData(
      this.collectionValueHistory
    );
    // CREATE AN ARRAT OF VALUES FOR ONLY DATA FROM priceHistoryWithUpdatedLabels WHICH HAS A LABEL === '24h
    const rawPriceHistoryMap = sortDataIntoRanges(
      priceHistoryWithUpdatedLabels
    );
    this.nivoChartData = rawPriceHistoryMap;
    this.markModified("nivoChartData");
    Object.keys(rawPriceHistoryMap).forEach((rangeKey) => {
      rawPriceHistoryMap[rangeKey] = aggregateAndAverageData(
        rawPriceHistoryMap[rangeKey]
      );
    });
    this.averagedChartData = rawPriceHistoryMap;
    this.markModified("averagedChartData");
    const updated = convertChartDataToArray(rawPriceHistoryMap);
    this.newNivoChartData = updated;
    this.markModified("newNivoChartData");

    //! STEP FOUR: CALCULATE COLLECTION STATS
    const updatedStats = updateCollectionStatistics(
      this.collectionStatistics,
      this.totalPrice,
      this.totalQuantity
    );
    this.collectionStatistics = updatedStats;
    this.markModified("collectionStatistics");

    const now = new Date();
    this.lastUpdated = now;
    this.markModified("lastUpdated");
    next();
    console.log("pre save hook for collection", this.name);
    console.log(this.collectionStatistics);

    //! STEP FIVE: SAVE COLLECTION
    await this.save();
  } catch (err) {
    next(err);
  }
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
