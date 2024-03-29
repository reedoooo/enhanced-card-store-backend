const { formatISO } = require("date-fns");
const logger = require("../configs/winston");
const roundToNearestHundredth = (num) => Math.round(num * 100) / 100;
exports.convertChartDataToArray = (averagedChartData) =>
  Object.values(averagedChartData);
exports.recalculatePriceHistory = (cardDataPoints) => {
  let totalValue = 0;
  return cardDataPoints.map((dataPoint) => {
    totalValue += dataPoint.num;
    return { num: totalValue, timestamp: dataPoint.timestamp };
  });
};
const getLabelsAndThresholds = () => [
  {
    label: "24hr",
    threshold: 1,
    points: 24,
    defaultFirst: 0,
    defaultLast: 31.2,
    defaultPrevious: 0,
  },
  {
    label: "7d",
    threshold: 7,
    points: 7,
    defaultFirst: 0,
    defaultLast: 65.1,
    defaultPrevious: 31.2,
  },
  {
    label: "30d",
    threshold: 30,
    points: 30,
    defaultFirst: 0,
    defaultLast: 129.9,
    defaultPrevious: 65.1,
  },
  {
    label: "90d",
    threshold: 90,
    points: 90,

    defaultFirst: 0,
    defaultLast: 284.8,
    defaultPrevious: 129.9,
  },
  {
    label: "180d",
    threshold: 180,
    points: 180,
    defaultFirst: 0,
    defaultLast: 449.7,
    defaultPrevious: 284.8,
  },
  {
    label: "270d",
    threshold: 270,
    points: 270,
    defaultFirst: 0,
    defaultLast: 714.6,
    defaultPrevious: 449.7,
  },
  {
    label: "365d",
    threshold: 365,
    points: 365,
    defaultFirst: 0,
    defaultLast: 979.5,
    defaultPrevious: 714.6,
  },
];
const getRequiredDataPoints = (data, requiredPoints) => {
  if (data.length <= requiredPoints) return data;

  // Calculate the interval for selecting data points evenly distributed across the range
  let sampledData = [];
  const everyNth = Math.floor(data.length / (requiredPoints - 1));

  // Always include the first and last data points
  for (let i = 0; i < data.length; i++) {
    if (i % everyNth === 0 || i === data.length - 1) {
      sampledData.push(data[i]);
    }

    // Stop if we've collected the required number of points
    if (sampledData.length >= requiredPoints) break;
  }

  // Ensure the last data point is always included
  if (sampledData[sampledData.length - 1].x !== data[data.length - 1].x) {
    sampledData[sampledData.length - 1] = data[data.length - 1];
  }

  return sampledData;
};
const interpolateValues = (start, end, length) => {
  const step = (end - start) / (length - 1);
  return Array.from({ length }, (_, index) =>
    roundToNearestHundredth(start + step * index)
  );
};
const interpolateTimeValues = (start, end, count) => {
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) =>
    new Date(start.getTime() + step * index).toISOString()
  );
};

const seedChartData = (chart, range) => {
  if (!chart || !Array.isArray(chart.data)) {
    logger.error("Invalid chart data provided to seedChartData.");
    return chart;
  }
  chart.data.sort((a, b) => new Date(a.x) - new Date(b.x));
  // Adjust data points to match the required points count
  if (chart.data.length !== range.points) {
    if (chart.data.length > range.points) {
      // Too many points: sample down to the required number
      const sampledData = getRequiredDataPoints(chart.data, range.points);
      chart.data = sampledData;
    } else if (chart.data.length < range.points) {
      const startTime = chart.data[0] ? new Date(chart.data[0].x) : new Date();
      const endTime = chart.data[chart.data.length - 1]
        ? new Date(chart.data[chart.data.length - 1].x)
        : new Date();
      endTime.setDate(startTime.getDate() + range.threshold);
      const interpolatedXValues = interpolateTimeValues(
        startTime,
        endTime,
        range.points
      );
      const interpolatedValues = interpolateValues(
        range.defaultFirst,
        range.defaultLast,
        range.points
      );

      chart.data = interpolatedXValues.map((x, index) => ({
        x: x,
        y: interpolatedValues[index],
      }));

      // Set the first data point's y-value to defaultPrevious if defined
      // if (range.defaultPrevious !== undefined && chart.data.length > 0) {
      //   chart.data[0].y = range.defaultPrevious;
      // }
    }
  }

  return chart;
};

exports.processAndSortTimeData = (cardDataArray) => {
  if (!Array.isArray(cardDataArray)) {
    logger.error("Invalid cardDataArray provided to processAndSortTimeData.");
    return {};
  }
  const labelsAndThresholds = getLabelsAndThresholds();
  let timeRangeDataMap = {};
  cardDataArray?.forEach((item) => {
    if (!item.timestamp || isNaN(new Date(item.timestamp).getTime())) {
      logger.error("Invalid timestamp detected", item);
      return;
    }
    const itemDate = new Date(item.timestamp);
    // const formattedDate = formatISO(itemDate);

    labelsAndThresholds?.forEach(
      ({ label, threshold, defaultFirst, defaultLast, defaultPrevious }) => {
        const diffDays = (new Date() - itemDate) / (1000 * 3600 * 24);
        if (diffDays <= threshold) {
          if (!timeRangeDataMap[label]) {
            timeRangeDataMap[label] = {
              id: label,
              name: `Last ${label.toUpperCase()}`,
              color: "#2e7c67",
              data: [],
              points: labelsAndThresholds.find((lt) => lt.label === label)
                .points,
              config: {
                defaultFirst,
                defaultLast,
                defaultPrevious,
                threshold,
              },
            };
          }
          timeRangeDataMap[label].data.push({
            x: itemDate.toISOString(),
            y: roundToNearestHundredth(item?.num),
          });
        }
      }
    );
  });
  Object.entries(timeRangeDataMap).forEach(([label, chart]) => {
    const rangeConfig = labelsAndThresholds.find(
      (range) => range.label === label
    );
    timeRangeDataMap[label] = seedChartData(chart, rangeConfig);
  });
  return timeRangeDataMap;
};
exports.aggregateAndValidateTimeRangeMap = (timeRangeDataMap) => {
  const now = new Date();
  const labelsAndThresholds = getLabelsAndThresholds();

  labelsAndThresholds?.forEach((labelThreshold) => {
    const relevantData = Array.isArray(timeRangeDataMap[labelThreshold.label])
      ? timeRangeDataMap[labelThreshold.label]
      : [];

    if (relevantData) {
      const nonZeroCount = relevantData?.filter(
        (item) => item?.y !== 0
      )?.length;
      const thresholdForInterpolation = Math?.ceil(0.75 * relevantData?.length);

      // Interpolate data if necessary
      if (nonZeroCount < thresholdForInterpolation) {
        const interpolatedValues = interpolateData(
          labelThreshold.defaultFirst,
          labelThreshold.defaultLast,
          relevantData.length
        );

        relevantData.forEach((item, index) => {
          // Assign interpolated values only where data is zero or missing
          if (item.y === 0 || item.y === undefined) {
            item.y = interpolatedValues[index];
          }
        });
      }

      // Ensure the continuity of data between adjacent time ranges
      if (labelThreshold.defaultPrevious !== undefined) {
        const previousRangeLabel =
          labelsAndThresholds[
            labelsAndThresholds.findIndex(
              (lt) => lt.label === labelThreshold.label
            ) - 1
          ]?.label;
        if (previousRangeLabel && timeRangeDataMap[previousRangeLabel]) {
          const lastItemOfPreviousRange =
            timeRangeDataMap[previousRangeLabel][
              timeRangeDataMap[previousRangeLabel].length - 1
            ];
          if (lastItemOfPreviousRange) {
            lastItemOfPreviousRange.y = labelThreshold.defaultPrevious;
          }
        }
      }
    }
  });

  return timeRangeDataMap;
};
exports.generateCardDataPoints = (cards) =>
  cards
    .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    .flatMap((card) =>
      Array.from({ length: card.quantity }, () => ({
        num: card.price,
        timestamp: new Date(card.addedAt).toISOString(),
      }))
    );
exports.processTimeSeriesData = (data) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const hourlyDataPoints = Array.from({ length: 24 }, (_, i) => ({
    x: new Date(oneDayAgo.getTime() + i * 60 * 60 * 1000).toISOString(),
    y: null,
  }));

  data.forEach((point) => {
    const pointDate = new Date(point.timestamp);
    const hourIndex = Math.floor((pointDate - oneDayAgo) / (3600 * 1000));
    if (
      hourIndex >= 0 &&
      hourIndex < 24 &&
      (hourlyDataPoints[hourIndex].y === null ||
        pointDate > new Date(hourlyDataPoints[hourIndex].x))
    ) {
      hourlyDataPoints[hourIndex] = {
        ...hourlyDataPoints[hourIndex],
        y: point.num,
      };
    }
  });

  // Forward fill null values with the last known value
  hourlyDataPoints.reduce((lastValue, point, index) => {
    if (point.y === null) {
      hourlyDataPoints[index].y = lastValue;
    }
    return hourlyDataPoints[index].y;
  }, hourlyDataPoints[0].y || 0);

  return hourlyDataPoints;
};
exports.updateCollectionStatistics = (
  currentStats,
  totalPrice,
  totalQuantity
) => ({
  totalQuantity: totalQuantity,
  totalPrice: totalPrice,
  highPoint: Math.max(currentStats.highPoint, totalPrice),
  lowPoint: Math.min(currentStats.lowPoint || Infinity, totalPrice),
  avgPrice: totalQuantity ? totalPrice / totalQuantity : 0,
  priceChange: totalPrice - currentStats.highPoint,
  percentageChange: currentStats.lowPoint
    ? ((totalPrice - currentStats.lowPoint) / currentStats.lowPoint) * 100
    : 0,
});
// /**
//  * Calculates the growth rate between the last and first data point in the given chart data.
//  *
//  * @param {Object} chart - The Nivo chart data object.
//  * @returns {Object} The Nivo chart data object with an additional growth property.
//  */
// exports.aggregateAndAverageData = (chart) => {
//   if (!chart?.data?.length) return chart;
//   chart = seedChartData(chart, { threshold: 1 }, 0); // Assume last 24 hours for seeding
//   const lastValue = chart.data[chart.data.length - 1].y;
//   const firstValue = chart.data[0].y;
//   const growth = firstValue ? ((lastValue - firstValue) / firstValue) * 100 : 0;

//   return { ...chart, growth };
// };
// const seedChartData = (chart, range) => {
//   if (!chart || !Array.isArray(chart.data)) {
//     console.error("Invalid chart data provided to seedChartData.");
//     return chart;
//   }
//   if (chart.data.length > range.points) {
//     chart.data = getRequiredDataPoints(chart.data, range.points);
//   }
//   const zeroCount = chart.data.filter((d) => !d.y).length;
//   const requiredPoints = range.points;

//   if (
//     zeroCount / chart.data.length > 0.75 ||
//     chart.data.length < requiredPoints
//   ) {
//     // If more than 75% of data are zeroes or not enough points, interpolate the data
//     const interpolatedValues = interpolateValues(
//       range.defaultFirst,
//       range.defaultLast,
//       requiredPoints
//     );

//     const interpolatedData = interpolatedValues.map((value, index) => ({
//       x:
//         index < chart.data.length
//           ? chart.data[index].x
//           : `Interpolated-${index}`,
//       y: value,
//     }));

//     // In case we have previous data point from a different range
//     if (range.defaultPrevious !== undefined && interpolatedData.length > 0) {
//       interpolatedData[0].y = range.defaultPrevious;
//     }
//     return {
//       ...chart,
//       data: interpolatedData,
//     };
//   }

//   return chart;
// };

// Object.keys(timeRangeDataMap)?.forEach((key) => {
//   const { data, defaultFirst, defaultLast, defaultPrevious, threshold } =
//     timeRangeDataMap[key];
//   timeRangeDataMap[key].data = seedChartData(
//     { defaultFirst, defaultLast, defaultPrevious, threshold },
//     data
//   );
// });
// exports.processTimeData = (dataArray) => {
//   const cumulativeData = this.recalculatePriceHistory(dataArray);

//   // dataArray = injectSeedData(dataArray);
//   const now = new Date();
//   // const labelsAndThresholds = getLabelsAndThresholds();

//   return cumulativeData?.map((item) => {
//     const itemDate = new Date(item.timestamp);
//     const diffDays = (now - itemDate) / (1000 * 3600 * 24);
//     let label = "365d";
//     if (diffDays <= 1) {
//       label = "24hr";
//     } else if (diffDays <= 7) {
//       label = "7d";
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
//     }
//     return { x: itemDate?.toISOString(), y: item?.num, label };
//   });
// };
// /**
//  * Sorts processed data into ranges based on the labels and thresholds defined in getLabelsAndThresholds function.
//  * @param {Object} processedData - Processed data with timestamp and value properties.
//  * @returns {Object} Object with keys as labels and values as Nivo charts data.
//  */
// exports.sortDataIntoRanges = (processedData) => {
//   const labelsAndThresholds = getLabelsAndThresholds();
//   if (!Array.isArray(labelsAndThresholds)) {
//     console.error(
//       "getLabelsAndThresholds did not return an array. Please check its implementation."
//     );
//     return {};
//   }
//   let nivoChartData = {};
//   labelsAndThresholds?.forEach((labelThreshold) => {
//     nivoChartData[labelThreshold.label] = seedChartData(
//       {
//         data: [],
//         color: "#2e7c67",
//         id: labelThreshold.label,
//         name: `Last ${labelThreshold.label.toUpperCase()}`,
//         growth: 0,
//       },
//       labelThreshold
//     );
//   });

//   processedData?.forEach((item) => {
//     if (item && "label" in item && "x" in item && "y" in item) {
//       const rangeData = nivoChartData[item.label];
//       if (rangeData) {
//         const existingPoint = rangeData.data.find((d) => d.x === item.x);
//         if (!existingPoint) {
//           rangeData.data.push({ x: item.x, y: item.y });
//         }
//       }
//     }
//   });

//   // Re-seed to ensure all ranges have sufficient data points after processing.
//   Object.keys(nivoChartData).forEach((label) => {
//     const labelThreshold = labelsAndThresholds.find((lt) => lt.label === label);
//     if (labelThreshold) {
//       nivoChartData[label] = seedChartData(
//         nivoChartData[label],
//         labelThreshold
//       );
//     }
//   });
//   return nivoChartData;
// };
// const getRequiredDataPoints = (data, requiredPoints) => {
//   if (data.length <= requiredPoints) return data;

//   // Calculate the interval for selecting data points evenly distributed across the range
//   let sampledData = [];
//   const everyNth = Math.floor(data.length / (requiredPoints - 1));

//   // Always include the first and last data points
//   for (let i = 0; i < data.length; i++) {
//     if (i % everyNth === 0 || i === data.length - 1) {
//       sampledData.push(data[i]);
//     }

//     // Stop if we've collected the required number of points
//     if (sampledData.length >= requiredPoints) break;
//   }

//   // Ensure the last data point is always included
//   if (sampledData[sampledData.length - 1].x !== data[data.length - 1].x) {
//     sampledData[sampledData.length - 1] = data[data.length - 1];
//   }

//   return sampledData;
// };
// // Handle cases with excess data points
// if (chart.data.length > range.points) {
//   chart.data = getRequiredDataPoints(chart.data, range.points);
// }

// // Handle cases requiring interpolation
// const zeroCount = chart.data.filter((d) => !d.y).length;
// if (
//   zeroCount / chart.data.length > 0.75 ||
//   chart.data.length < range.points
// ) {
//   const interpolatedValues = interpolateValues(
//     range.defaultFirst,
//     range.defaultLast,
//     range.points
//   );
//   chart.data = interpolatedValues.map((y, index) => ({
//     x: chart?.data[index]?.x,
//     y,
//   }));

//   if (range.defaultPrevious !== undefined && chart.data.length > 0) {
//     chart.data[0].y = range.defaultPrevious;
//   }
// }
// if (
//   zeroCount / chart.data.length > 0.75 ||
//   chart.data.length < range.points
// ) {
//   const interpolatedValues = interpolateValues(
//     range.defaultFirst,
//     range.defaultLast,
//     range.points
//   );

//   chart.data = interpolatedValues.map((y, index) => ({
//     x: chart.data[index]?.x || `Interpolated-${index}`,
//     y,
//   }));

//   if (range.defaultPrevious !== undefined && chart.data.length > 0) {
//     chart.data[0].y = range.defaultPrevious;
//   }
// }

//   return chart;
// };
// /**
//  * Processes card data to create cumulative collection values and categorizes them into different time ranges.
//  *
//  * @param {Object[]} cardDataArray - An array of objects with timestamp and card price.
//  * @returns {Object} Object with keys as labels and arrays of data points as values.
//  */
