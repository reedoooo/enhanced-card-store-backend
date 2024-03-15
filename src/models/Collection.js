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
// const groupAndAverageDataForRanges = (data, timeRanges) => {
//   const processedData = {};
//   const clusterCounts = {
//     "24h": 24,
//     "7d": 7,
//     "30d": 30,
//     "90d": 30,
//     "180d": 30,
//     "270d": 30,
//     "365d": 30,
//   };

//   Object.keys(clusterCounts).forEach((rangeKey) => {
//     const numClusters = clusterCounts[rangeKey];
//     const timeRangeData = timeRanges[rangeKey];
//     let averagedData = [];
//     if (timeRangeData && timeRangeData.length >= numClusters) {
//       // More data points than clusters, perform averaging within clusters
//       console.log(
//         "More data points than clusters, performing averaging...".red
//       );
//       averagedData = timeRangeData
//         .sort((a, b) => new Date(a.x) - new Date(b.x)) // Ensure data is sorted by time
//         .reduce((clusters, point, index, array) => {
//           // console.log('Point:', point);
//           const clusterIndex = Math.floor(index / (array.length / numClusters));
//           // console.log('Cluster index:', clusterIndex);
//           clusters[clusterIndex] = clusters[clusterIndex] || [];
//           clusters[clusterIndex].push(point);
//           return clusters;
//         }, new Array(numClusters).fill(null))
//         .map((cluster) => {
//           const avgNum =
//             cluster.reduce((sum, p) => sum + p.num, 0) / cluster.length;
//           const midPoint = cluster[Math.floor(cluster.length / 2)];
//           const formatDate = (date) => format(date, "yyyy-MM-dd HH:mm:ss");
//           return {
//             label: formatDate(new Date(midPoint.timestamp)),
//             x: new Date(midPoint.timestamp).toISOString(),
//             y: avgNum,
//           };
//         });
//     } else if (timeRangeData && timeRangeData?.length > 0) {
//       // Fewer data points than clusters, interpolate additional points
//       console.log(
//         "Fewer data points than clusters, interpolating additional points..."
//           .red
//       );
//       for (let i = 0; i < numClusters; i++) {
//         if (i < timeRangeData.length) {
//           averagedData.push(timeRangeData[i]);
//         } else {
//           const lastPoint = averagedData[averagedData.length - 1];
//           const nextIndex = i + 1 - averagedData.length;
//           const nextPoint =
//             timeRangeData[
//               nextIndex < timeRangeData.length
//                 ? nextIndex
//                 : timeRangeData.length - 1
//             ];
//           const interpolatedY =
//             lastPoint && nextPoint
//               ? (lastPoint.y + nextPoint.y) / 2
//               : lastPoint.y;
//           averagedData.push({ x: lastPoint.x, y: interpolatedY });
//         }
//       }
//     }

//     processedData[rangeKey] = averagedData;
//   });

//   return processedData;
// };
const groupAndAverageDataForRanges = (nivoChartData) => {
  const processedData = {};
  const clusterCounts = {
    "24hr": 24,
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "180d": 180,
    "270d": 270,
    "365d": 365,
  };

  Object.keys(nivoChartData).forEach((rangeKey) => {
    const numClusters = clusterCounts[rangeKey] || 30; // Fallback to a default value if necessary
    let rangeData = nivoChartData[rangeKey].data;
    let averagedData = [];

    if (rangeData && rangeData.length >= numClusters) {
      // More data points than clusters, perform averaging within clusters
      averagedData = rangeData
        .sort((a, b) => new Date(a.x) - new Date(b.x))
        .reduce((clusters, point, index, array) => {
          const clusterIndex = Math.floor(index / (array.length / numClusters));
          clusters[clusterIndex] = clusters[clusterIndex] || [];
          clusters[clusterIndex].push(point);
          return clusters;
        }, new Array(numClusters).fill(null))
        .map((cluster) => {
          const avgY =
            cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length;
          const midPointIndex = Math.floor(cluster.length / 2);
          return {
            x: cluster[midPointIndex].x,
            y: avgY,
          };
        });
    } else if (rangeData && rangeData.length > 0) {
      // Directly use available data if fewer data points than clusters
      averagedData = [...rangeData];
    }

    processedData[rangeKey] = {
      ...nivoChartData[rangeKey],
      data: averagedData,
    };
  });

  return processedData;
};
function generateRandomDataSets(
  baseDate,
  baseY,
  incrementType,
  totalPoints,
  finalY
) {
  const incrementMap = {
    "24h": 1 / 24, // Increment by hour
    "7d": 1, // Increment by day
    "30d": 1,
    "90d": 3,
    "180d": 6,
    "270d": 9,
    "365d": 12,
  };

  const dataSets = [];
  let currentDate = new Date(baseDate);
  let currentY = baseY;
  const yIncrement = (finalY - baseY) / totalPoints;

  for (let i = 0; i < totalPoints; i++) {
    dataSets.push({
      _id: generateRandomId(), // Implement this function to generate unique IDs
      x: currentDate.toISOString(),
      y: parseFloat((currentY += yIncrement * Math.random() * 2).toFixed(2)), // Randomize the increment a bit
    });

    currentDate = new Date(
      currentDate.getTime() + incrementMap[incrementType] * 24 * 60 * 60 * 1000
    );
  }

  return dataSets;
}
function generateRandomId() {
  return Math.floor(Math.random() * Date.now()).toString(16);
}
// Base parameters
const backupBaseDate = "2024-02-25T10:13:43.410Z";
const baseDate = new Date(
  new Date().getTime() - 7 * 24 * 60 * 60 * 1000
).toISOString();
const startValue = 3.99;
const endValue1 = 107.93;
const endValue2 = 257.56;
const endValue3 = 399.99;
const endValue4 = 500.0;
const endValue5 = 875.59;
const endValue6 = 1578.43;
const endValue7 = 2745.32;

// Generate datasets for each time range
const data24h = generateRandomDataSets(
  baseDate,
  startValue,
  "24h",
  24,
  endValue1
);
const data7d = generateRandomDataSets(baseDate, startValue, "7d", 7, endValue2);
const data30d = generateRandomDataSets(
  baseDate,
  startValue,
  "30d",
  30,
  endValue3
);
const data90d = generateRandomDataSets(
  baseDate,
  startValue,
  "90d",
  30,
  endValue4
);
const data180d = generateRandomDataSets(
  baseDate,
  startValue,
  "180d",
  30,
  endValue5
);
const data270d = generateRandomDataSets(
  baseDate,
  startValue,
  "270d",
  30,
  endValue6
);
const data365d = generateRandomDataSets(
  baseDate,
  startValue,
  "365d",
  30,
  endValue7
);

const convertToNivoFormat = (timeRange, data) => {
  return data.map((dataPoint) => {
    return {
      id: timeRange,
      color: "#2e7c67", // Example color, adjust as needed
      data: [
        {
          x: dataPoint.x,
          y: dataPoint.y,
        },
      ],
    };
  });
};

const convertAllToNivoFormat = () => {
  return [
    convertToNivoFormat("24h", data24h),
    convertToNivoFormat("7d", data7d),
    convertToNivoFormat("30d", data30d),
    convertToNivoFormat("90d", data90d),
    convertToNivoFormat("180d", data180d),
    convertToNivoFormat("270d", data270d),
    convertToNivoFormat("365d", data365d),
  ];
};
function updateStatistics(cards, initialTotalPrice) {
  let totalPrice = 0;
  let totalQuantity = 0;
  let highPoint = 0;
  let lowPoint = Infinity;
  let avgPrice = 0;
  let percentageChange = 0;
  let priceChange = 0;

  cards.forEach((card) => {
    const cardTotalPrice = card.price * card.quantity;
    totalPrice += cardTotalPrice;
    totalQuantity += card.quantity;
    highPoint = Math.max(highPoint, cardTotalPrice);
    lowPoint = Math.min(lowPoint, cardTotalPrice);
    avgPrice += cardTotalPrice;
    percentageChange += (cardTotalPrice / initialTotalPrice) * 100;
    priceChange += cardTotalPrice - initialTotalPrice;
  });

  // const totalDifference = totalPrice - initialTotalPrice;
  // const percentageChange = initialTotalPrice
  //   ? (totalDifference / initialTotalPrice) * 100
  //   : 0;

  return {
    totalPrice,
    totalQuantity,
    highPoint,
    lowPoint,
    avgPrice,
    percentageChange,
    priceChange,
  };
}
const createCommonFields = () => ({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  totalPrice: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
});
const createNewPriceEntry = (price) => ({
  num: price,
  timestamp: new Date(),
});
const createNewPriceEntryWithOldDate = (price, time) => ({
  num: price,
  timestamp: time,
});
// Formats date strings safely
const formatDate = (dateInput) => {
  let date;
  if (dateInput instanceof Date) {
    date = dateInput; // Use the Date object directly
  } else if (typeof dateInput === "string") {
    date = parseISO(dateInput); // Parse string date input
  }

  if (date && isValid(date)) {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  } else {
    return "Invalid Date"; // Fallback for undefined or invalid dates
  }
};

// Adds days to a date and returns a new date
const addDays = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

// Calculates the date 'daysAgo' days before the current date
const calculateTimeAgo = (days) => addDays(new Date(), -days);

// Filters the history array to include only entries within the specified 'daysAgo'
function processTimeRanges(history, daysAgo) {
  const thresholdDate = calculateTimeAgo(daysAgo);
  return history.filter((entry) => new Date(entry.timestamp) >= thresholdDate);
}
// Maps over time ranges to format the data for charting
function updateChartData(timeRanges) {
  return Object.entries(timeRanges).map(([key, value]) => ({
    id: key,
    color: "#2e7c67", // Example color, adjust as needed
    data: value.map((datapoint) => ({
      x: formatDate(datapoint.timestamp), // Ensure dates are formatted correctly
      y: datapoint.num, // Use 'num' as the y-value
    })),
  }));
}

// function prepareChartData(cards) {
//   let lastXValue = new Date();
//   return cards.flatMap((card) => {
//     return Array.from({ length: card.quantity }).map((_, i) => {
//       const newDate = new Date(lastXValue.getTime() + 6 * 60 * 60 * 1000); // 6 hours ahead
//       lastXValue = newDate;
//       return { x: newDate, y: card.price * (i + 1) };
//     });
//   });
// }
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
  // Initialize the nivoChartData structure
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

  // Iterate through each processed data item and add it to the correct range
  // processedData.forEach((item) => {
  //   switch (item.label) {
  //     case "24hr":
  //       nivoChartData["24hr"].data.push({ x: item.x, y: item.y });
  //       break;
  //     case "30d":
  //       nivoChartData["30d"].data.push({ x: item.x, y: item.y });
  //       break;
  //     case "90d":
  //       nivoChartData["90d"].data.push({ x: item.x, y: item.y });
  //       break;
  //     case "180d":
  //       nivoChartData["180d"].data.push({ x: item.x, y: item.y });
  //       break;
  //     case "270d":
  //       nivoChartData["270d"].data.push({ x: item.x, y: item.y });
  //       break;
  //     case "365d":
  //       nivoChartData["365d"].data.push({ x: item.x, y: item.y });
  //       break;
  //     default:
  //       // Assuming all other data falls within 7 days
  //       nivoChartData["7d"].data.push({ x: item.x, y: item.y });
  //       break;
  //   }
  // });
  processedData.forEach((item) => {
    // Use an array to keep track of which ranges the item should be added to
    const applicableRanges = [];

    // Determine the applicable ranges based on the item's label
    switch (item.label) {
      case "24hr":
        applicableRanges.push("24hr", "7d", "30d", "90d", "180d", "270d", "365d");
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
    "24hr": 24, // 24 data points, one for each hour
    "7d": 7, // 7 data points, one for each day
    "30d": 30, // 30 data points, one for each day
    "90d": 30, // 30 data points for 90 days
    "180d": 30, // 30 data points for 180 days
    "270d": 30, // 30 data points for 270 days
    "365d": 30, // 30 data points for 365 days
  };

  const timeRangeDays = {
    "24hr": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "180d": 180,
    "270d": 270,
    "365d": 365,
  };

  const rangeKey = chart.id;
  const numClusters = clusterCounts[rangeKey];
  const totalRangeDays = timeRangeDays[rangeKey];
  let processedData = [];
  // const timeIncrements = {
  //   "24hr": 3600 * 1000, // 1 hour in milliseconds
  //   "7d": 24 * 3600 * 1000, // 1 day in milliseconds
  //   "30d": (30 / numClusters) * 24 * 3600 * 1000, // Proportional days in milliseconds
  //   "90d": (90 / numClusters) * 24 * 3600 * 1000,
  //   "180d": (180 / numClusters) * 24 * 3600 * 1000,
  //   "270d": (270 / numClusters) * 24 * 3600 * 1000,
  //   "365d": (365 / numClusters) * 24 * 3600 * 1000,
  // };

  if (chart.data.length >= numClusters) {
    // More data points than clusters: average data within each cluster
    // processedData = chart.data
    //   .sort((a, b) => new Date(a.x) - new Date(b.x))
    //   .reduce((clusters, point, index, array) => {
    //     const clusterIndex = Math.floor(index / (array.length / numClusters));
    //     clusters[clusterIndex] = clusters[clusterIndex] || [];
    //     clusters[clusterIndex].push(point);
    //     return clusters;
    //   }, new Array(numClusters).fill(null))
    //   .map((cluster, index) => {
    //     const avgY = cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length;
    //     const clusterDays = totalRangeDays / numClusters;
    //     const firstDate = new Date(chart.data[0].x);
    //     const clusterDate = new Date(firstDate);
    //     clusterDate.setDate(firstDate.getDate() + clusterDays * index);
    //     return { x: clusterDate.toISOString(), y: avgY };
    //   });
    processedData = chart.data
      .sort((a, b) => new Date(a.x) - new Date(b.x))
      .reduce((clusters, point, index, array) => {
        const clusterIndex = Math.floor(
          index / (array.length / clusterCounts[rangeKey])
        );
        clusters[clusterIndex] = clusters[clusterIndex] || [];
        clusters[clusterIndex].push(point);
        return clusters;
      }, new Array(clusterCounts[rangeKey]).fill(null))
      .map((cluster, index) => {
        const avgY = cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length;
        const firstDate = new Date(chart.data[0].x);
        const clusterDate = new Date(firstDate.getTime() + index * 3600 * 1000); // 3600 * 1000 milliseconds per hour
        return { x: clusterDate.toISOString(), y: avgY };
      });
  } else {
    // Fewer data points than clusters: maintain existing data and add zeroes where necessary
    processedData = chart.data;
    const increment = totalRangeDays / numClusters;
    const firstDate = new Date(chart.data[0]?.x || new Date());

    for (let i = processedData.length; i < numClusters; i++) {
      const newDate = new Date(firstDate);
      newDate.setDate(firstDate.getDate() + increment * i);
      processedData.push({ x: newDate.toISOString(), y: 0 });
    }
    let lastIndex = 0;
    // for (let i = processedData.length; i < numClusters; i++) {
    //   const previousDate = new Date(processedData[processedData.length - 1]?.x);
    //   if (isNaN(previousDate.getTime())) {
    //     console.error("Invalid date encountered:", previousDate);
    //     break; // Or handle the error more gracefully
    //   }

    //   const newTimestamp = new Date(
    //     previousDate.getTime() + increment * (i - processedData.length + 1)
    //   );
    //   if (!isNaN(newTimestamp.getTime())) {
    //     processedData.push({ x: newTimestamp.toISOString(), y: 0 });
    //   } else {
    //     console.error(
    //       "Failed to calculate new timestamp for interpolated data point."
    //     );
    //   }
    // }
  }
  if (rangeKey === "24hr" && chart.data.length >= numClusters) {
    const now = new Date();
    processedData = Array.from({ length: numClusters }).map((_, index) => {
      const hourOffset = (index - numClusters + 1) * 3600 * 1000; // Offset in milliseconds
      const newTimestamp = new Date(now.getTime() + hourOffset);
      const dataPoint = chart.data.find((point, i) => {
        // Find the closest data point to each hour, or use a fallback strategy
        return i === Math.floor((chart.data.length / numClusters) * index);
      });
      return {
        x: newTimestamp.toISOString(),
        y: dataPoint ? dataPoint.y : 0, // Fallback to 0 if no data point is found
      };
    });
  } else if (rangeKey === "24hr") {
    // If there are fewer than 24 data points, interpolate or extend with 0s as necessary
    const now = new Date();
    processedData = chart.data.length ? chart.data : [];
    for (let i = processedData.length; i < numClusters; i++) {
      const hourOffset = (i - numClusters + 1) * 3600 * 1000;
      const newTimestamp = new Date(now.getTime() + hourOffset);
      processedData.push({
        x: newTimestamp.toISOString(),
        y: 0,
      });
    }
  }

  return {
    id: chart.id,
    name: chart.name,
    color: chart.color,
    data: processedData,
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

  // Avoid division by zero if lowPoint is zero, also consider if lowPoint should be updated based on totalPrice
  updatedStats.percentageChange =
    updatedStats.lowPoint !== 0
      ? (updatedStats.priceChange / updatedStats.lowPoint) * 100
      : 0;

  return updatedStats;
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

    // Assuming the initial state of the collectionPriceHistory should have the initial price at the beginning of the tracking period.
    this.collectionPriceHistory = [];

    if (this.cards && this.cards.length > 0) {
      let cumulativePrice = 0;

      const cardsInCollection = await CardInCollection.find({
        _id: { $in: this.cards },
      });

      cardsInCollection.forEach((card) => {
        const cardTotalPrice = card.price * card.quantity;
        this.totalPrice += cardTotalPrice;
        this.totalQuantity += card.quantity;

        card.priceHistory.forEach((priceEntry) => {
          logger.info("CUM PRICE", JSON.stringify(priceEntry));
          console.log(JSON.stringify(priceEntry));
          const converted = JSON.stringify(priceEntry);
          cumulativePrice += converted.num;
          // Ensure priceEntry.num is defined and cumulativePrice is correctly calculated
          // if (typeof priceEntry.num === "number") {
          //   cumulativePrice += priceEntry.num * card.quantity; // Adjust based on the logic needed
          // }

          this.collectionPriceHistory.push({
            timestamp: priceEntry.timestamp,
            num: priceEntry.num,
          });
        });
      });
      // logger.info('CUM PRICE', cumulativePrice)

      // Sort collectionPriceHistory by timestamp after all entries are added
      this.collectionPriceHistory.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      this.markModified("collectionPriceHistory");

      // logger.info('CUM PRICE', this.collectionPriceHistory)
    }
    // this.markModified("collectionPriceHistory");

    const priceHistoryWithUpdatedLabels = processTimeData(
      this.collectionPriceHistory
    );
    // this.collectionPriceHistory = priceHistoryWithUpdatedLabels;
    // this.markModified("collectionPriceHistory");
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
    next();
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
  // Other models as needed
};
