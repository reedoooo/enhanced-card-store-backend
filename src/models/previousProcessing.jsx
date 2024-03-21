// function processTimeData(dataArray) {
//   const now = new Date();
//   return dataArray.map((item) => {
//     const itemDate = new Date(item.timestamp);
//     const diffDays = (now - itemDate) / (1000 * 3600 * 24);
//     let label;

//     if (diffDays <= 1) {
//       label = "24hr";
//     } else if (diffDays <= 30) {
//       label = "30d";
//     } else if (diffDays <= 90) {
//       label = "90d";
//     } else if (diffDays <= 180) {
//       label = "180d";
//     } else if (diffDays <= 270) {
//       label = "270d";
//     } else if (diffDays <= 365) {
//       label = "365d";
//     } else {
//       label = "365d+"; // Consider data older than 365 days
//     }

//     return {
//       x: itemDate.toISOString(),
//       y: item.num,
//       label: label,
//     };
//   });
// }
// // ! CRUCIAL: SORTS DATA INTO RANGES
// function sortDataIntoRanges(processedData) {
//   let nivoChartData = {
//     "24hr": {
//       id: "24hr",
//       name: "Last 24 Hours",
//       color: "#2e7c67",
//       data: [],
//     },
//     "7d": {
//       id: "7d",
//       name: "Last 7 Days",
//       color: "#2e7c67",
//       data: [],
//     },
//     "30d": {
//       id: "30d",
//       name: "Last 30 Days",
//       color: "#2e7c67",
//       data: [],
//     },
//     "90d": {
//       id: "90d",
//       name: "Last 90 Days",
//       color: "#2e7c67",
//       data: [],
//     },
//     "180d": {
//       id: "180d",
//       name: "Last 180 Days",
//       color: "#2e7c67",
//       data: [],
//     },
//     "270d": {
//       id: "270d",
//       name: "Last 270 Days",
//       color: "#2e7c67",
//       data: [],
//     },
//     "365d": {
//       id: "365d",
//       name: "Last 365 Days",
//       color: "#2e7c67",
//       data: [],
//     },
//   };

//   processedData.forEach((item) => {
//     // Use an array to keep track of which ranges the item should be added to
//     const applicableRanges = [];

//     // Determine the applicable ranges based on the item's label
//     switch (item.label) {
//       case "24hr":
//         applicableRanges.push(
//           "24hr",
//           "7d",
//           "30d",
//           "90d",
//           "180d",
//           "270d",
//           "365d"
//         );
//         break;
//       case "7d":
//         applicableRanges.push("7d", "30d", "90d", "180d", "270d", "365d");
//         break;
//       case "30d":
//         applicableRanges.push("30d", "90d", "180d", "270d", "365d");
//         break;
//       case "90d":
//         applicableRanges.push("90d", "180d", "270d", "365d");
//         break;
//       case "180d":
//         applicableRanges.push("180d", "270d", "365d");
//         break;
//       case "270d":
//         applicableRanges.push("270d", "365d");
//         break;
//       case "365d":
//         applicableRanges.push("365d");
//         break;
//     }

//     // For each applicable range, add the item to that range's data
//     applicableRanges.forEach((range) => {
//       nivoChartData[range].data.push({ x: item.x, y: item.y });
//     });
//   });

//   return nivoChartData;
// }
// // ! CRUCIAL: AGGREGATES AND AVERAGES DATA WITHIN RANGES
// function aggregateAndAverageData(chart) {
//   const clusterCounts = {
//     "24hr": 24,
//     "7d": 7,
//     "30d": 30,
//     "90d": 90,
//     "180d": 180,
//     "270d": 270,
//     "365d": 365,
//   };

//   const rangeKey = chart.id;
//   const numClusters = clusterCounts[rangeKey];
//   let processedData = [];
//   let growth = 0; // Initialize growth

//   if (chart.data.length === 0) {
//     // Handle the case with no initial data
//     const now = new Date();
//     for (let i = 0; i < numClusters; i++) {
//       let newTimestamp = new Date();
//       if (rangeKey === "24hr") {
//         newTimestamp.setHours(now.getHours() - (24 - i), 0, 0, 0);
//       } else {
//         newTimestamp.setDate(now.getDate() - (numClusters - i));
//       }
//       processedData.push({ x: newTimestamp.toISOString(), y: 0 });
//     }
//   } else {
//     const sortedData = chart.data.sort((a, b) => new Date(a.x) - new Date(b.x));
//     if (rangeKey === "24hr") {
//       // Initialize an array to keep track of hourly values
//       processedData = new Array(24).fill(null).map((_, index) => {
//         let dataHour = new Date(sortedData[0].x);
//         dataHour.setHours(dataHour.getHours() + index, 0, 0, 0);
//         return { x: dataHour.toISOString(), y: null };
//       });

//       // Iterate over the sorted data to fill the processedData with the latest values
//       sortedData.forEach((dataPoint) => {
//         let dataPointHour = new Date(dataPoint.x).getHours();
//         processedData[dataPointHour].y = dataPoint.y;
//       });

//       // Forward fill the processedData to ensure all nulls are replaced with the last known value
//       let lastKnownValue = 0;
//       processedData.forEach((data, index) => {
//         if (data.y !== null) {
//           lastKnownValue = data.y;
//         } else {
//           processedData[index].y = lastKnownValue;
//         }
//       });

//       const firstValue = processedData.find((data) => data.y !== null)?.y || 0;
//       const lastValue =
//         [...processedData].reverse().find((data) => data.y !== null)?.y || 0;

//       if (firstValue !== 0) {
//         growth = ((lastValue - firstValue) / firstValue) * 100;
//       } else {
//         growth = lastValue !== 0 ? 100 : 0; // If first value is 0 and last value is not, growth is 100%
//       }
//     } else {
//       // Initialize processedData for daily granularity
//       processedData = new Array(numClusters).fill(null).map((_, index) => {
//         let dataDay = new Date(sortedData[0].x);
//         dataDay.setDate(dataDay.getDate() + index);
//         return { x: dataDay.toISOString(), y: null };
//       });

//       // Populate with known values and apply forward filling
//       sortedData.forEach((dataPoint) => {
//         let dataPointIndex = Math.floor(
//           (new Date(dataPoint.x) - new Date(sortedData[0].x)) /
//             (24 * 3600 * 1000)
//         );
//         if (dataPointIndex < numClusters) {
//           processedData[dataPointIndex].y = dataPoint.y;
//         }
//       });

//       let lastKnownDailyValue = 0;
//       processedData.forEach((data, index) => {
//         if (data.y !== null) {
//           lastKnownDailyValue = data.y;
//         } else {
//           processedData[index].y = lastKnownDailyValue;
//         }
//       });
//     }
//   }

//   return {
//     id: chart.id,
//     name: chart.name,
//     color: chart.color,
//     growth: growth,
//     data: processedData.filter((data) => data.y !== null),
//   };
// }
// //! CRUCIAL: CONVERT NIVO CHART DATA TO ARRAY
// function convertChartDataToArray(averagedChartData) {
//   return Object.values(averagedChartData);
// }
// // ! CRUCIAL: UPDATE COLLECTION STATISTICS
// // function updateCollectionStatistics(currentStats, totalPrice, totalQuantity) {
// //   const updatedStats = {
// //     highPoint: Math.max(currentStats.highPoint, totalPrice),
// //     lowPoint: Math.min(currentStats.lowPoint, totalPrice), // Should this be totalPrice instead of 0 to make sense?
// //     avgPrice: totalQuantity > 0 ? totalPrice / totalQuantity : 0,
// //     priceChange: totalPrice - (currentStats.highPoint || 0),
// //     percentageChange: 0,
// //   };
// //   updatedStats.percentageChange =
// //     updatedStats.lowPoint !== 0
// //       ? (updatedStats.priceChange / updatedStats.lowPoint) * 100
// //       : 0;

// //   return updatedStats;
// // }
// function generateCardDataPoints(cards) {
//   // Sort cards by addedAt timestamp
//   const sortedCards = cards.sort(
//     (a, b) => new Date(a.addedAt) - new Date(b.addedAt)
//   );

//   let dataPoints = [];

//   sortedCards.forEach((card) => {
//     // Extract necessary details from each card
//     const { price, quantity, addedAt } = card;
//     let timestamp = new Date(addedAt - 3600000); // Subtract 1 hour to ensure the first data point is within the last
//     // 24hours

//     // Generate data points for each quantity of the card
//     for (let i = 0; i < quantity; i++) {
//       dataPoints.push({
//         num: price,
//         timestamp: timestamp.toISOString(),
//       });
//       // Increment timestamp by 1 hour for the next quantity of the same card
//       timestamp = new Date(timestamp.getTime());
//     }
//   });

//   return dataPoints;
// }
// function recalculatePriceHistory(cardDataPoints) {
//   let priceHistory = [];
//   let totalValue = 0;

//   // Increment the total value for each data point
//   cardDataPoints?.forEach((dataPoint) => {
//     totalValue += dataPoint.num;
//     priceHistory.push({
//       num: totalValue,
//       timestamp: dataPoint.timestamp.toISOString(),
//     });
//   });

//   return priceHistory;
// }
// function processTimeSeriesData(data) {
//   const now = new Date();
//   const oneDayAgo = subDays(now, 1);
//   const hourlyDataPoints = Array.from({ length: 24 }, (_, i) => ({
//     x: formatISO(addHours(startOfHour(oneDayAgo), i)),
//     y: null,
//   }));

//   const sortedData = data
//     .filter((d) =>
//       isWithinInterval(new Date(d.timestamp), { start: oneDayAgo, end: now })
//     )
//     .sort((a, b) => compareAsc(new Date(a.timestamp), new Date(b.timestamp)));

//   sortedData.forEach((point) => {
//     const hourIndex = differenceInHours(new Date(point.timestamp), oneDayAgo);
//     hourlyDataPoints[hourIndex].y = point.num;
//   });

//   // Fill any gaps in the data by propagating the last known value forward
//   let lastKnownValue =
//     hourlyDataPoints.find((point) => point.y !== null)?.y || 0;
//   hourlyDataPoints.forEach((point) => (point.y = point.y ?? lastKnownValue));

//   return hourlyDataPoints;
// }
