const getLabelsAndThresholds = () => [
  { label: "24hr", threshold: 1 },
  { label: "7d", threshold: 7 },
  { label: "30d", threshold: 30 },
  { label: "90d", threshold: 90 },
  { label: "180d", threshold: 180 },
  { label: "270d", threshold: 270 },
  { label: "365d", threshold: 365 },
];
const injectSeedData = (dataArray, minItems = 5, cardPrice = 1) => {
  if (dataArray.length >= minItems) return dataArray;

  const now = new Date();
  const additionalItemsNeeded = minItems - dataArray.length;
  const oneHour = 1000 * 60 * 60;

  for (let i = 0; i < additionalItemsNeeded; i++) {
    dataArray.push({
      num: cardPrice,
      timestamp: new Date(now - i * oneHour).toISOString(),
    });
  }

  return dataArray.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
};
const seedChartData = (chartData, range, defaultValue = 0) => {
  if (chartData.data.length > 0) return chartData;

  const now = new Date();
  const end = now;
  const start = new Date(now - range.threshold * 24 * 60 * 60 * 1000);

  let date = start;
  while (date <= end) {
    chartData.data.push({
      x: date.toISOString(),
      y: defaultValue,
    });
    date = new Date(date.getTime() + 24 * 60 * 60 * 1000); // Increment by one day
  }

  return chartData;
};
/**
 * Returns an array of objects with timestamp and value for each data point.
 * @param {Object[]} dataArray - An array of objects with timestamp and value properties.
 * @returns {Object[]} An array of objects with timestamp and value for each data point.
 */
exports.processTimeData = (dataArray) => {
  dataArray = injectSeedData(dataArray);
  const now = new Date();
  const labelsAndThresholds = getLabelsAndThresholds();

  return dataArray?.map((item) => {
    const itemDate = new Date(item.timestamp);
    const diffDays = (now - itemDate) / (1000 * 3600 * 24);
    let label = "365d";

    for (const { label: currentLabel, threshold } of labelsAndThresholds) {
      if (diffDays <= threshold) {
        label = currentLabel;
        break;
      }
    }

    return { x: itemDate?.toISOString(), y: item?.num, label };
  });
};
/**
 * Sorts processed data into ranges based on the labels and thresholds defined in getLabelsAndThresholds function.
 * @param {Object} processedData - Processed data with timestamp and value properties.
 * @returns {Object} Object with keys as labels and values as Nivo charts data.
 */
exports.sortDataIntoRanges = (processedData) => {
  if (!Array.isArray(processedData)) {
    console.error(
      "Invalid processed data provided to sortDataIntoRanges. Expected an array."
    );
    return {};
  }
  const labelsAndThresholds = getLabelsAndThresholds();
  if (!Array.isArray(labelsAndThresholds)) {
    console.error(
      "getLabelsAndThresholds did not return an array. Please check its implementation."
    );
    return {};
  }
  let nivoChartData = labelsAndThresholds?.reduce((acc, labelThreshold) => {
    if (!labelThreshold || typeof labelThreshold.label !== "string") {
      console.error(
        "Invalid label threshold encountered in sortDataIntoRanges."
      );
      return acc;
    }

    const chartDataSeed = seedChartData(
      {
        data: [],
        color: "#2e7c67",
        id: labelThreshold.label,
        name: `Last ${labelThreshold.label.toUpperCase()}`,
      },
      labelThreshold
    );

    if (!chartDataSeed || typeof chartDataSeed !== "object") {
      console.error(
        "seedChartData returned an invalid object. Please check its implementation."
      );
      return acc;
    }

    acc[labelThreshold.label] = chartDataSeed;
    return acc;
  }, {});
  processedData?.forEach((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("label" in item) ||
      !("x" in item) ||
      !("y" in item)
    ) {
      console.error(
        "Invalid item encountered in processedData within sortDataIntoRanges."
      );
      return;
    }

    const range = item.label in nivoChartData ? item.label : "365d";
    nivoChartData[range]?.data.push({ x: item.x, y: item.y });
  });

  return nivoChartData;
};
/**
 * Calculates the growth rate between the last and first data point in the given chart data.
 *
 * @param {Object} chart - The Nivo chart data object.
 * @returns {Object} The Nivo chart data object with an additional growth property.
 */
exports.aggregateAndAverageData = (chart) => {
  if (!chart?.data?.length) return chart;
  chart = seedChartData(chart, { threshold: 1 }, 0); // Assume last 24 hours for seeding
  const lastValue = chart.data[chart.data.length - 1].y;
  const firstValue = chart.data[0].y;
  const growth = firstValue ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  return { ...chart, growth };
};

exports.convertChartDataToArray = (averagedChartData) =>
  Object.values(averagedChartData);

/**
 * Updates the collection statistics with the given total price and total quantity.
 *
 * @param {Object} currentStats - The current collection statistics.
 * @param {number} totalPrice - The total price of the items in the collection.
 * @param {number} totalQuantity - The total quantity of the items in the collection.
 * @returns {Object} The updated collection statistics.
 */
exports.updateCollectionStatistics = (
  currentStats,
  totalPrice,
  totalQuantity
) => ({
  highPoint: Math.max(currentStats.highPoint, totalPrice),
  lowPoint: Math.min(currentStats.lowPoint || Infinity, totalPrice),
  avgPrice: totalQuantity ? totalPrice / totalQuantity : 0,
  priceChange: totalPrice - currentStats.highPoint,
  percentageChange: currentStats.lowPoint
    ? ((totalPrice - currentStats.lowPoint) / currentStats.lowPoint) * 100
    : 0,
});
/**
 * Returns an array of objects with timestamp and value for each data point.
 * @param {Object[]} dataArray - An array of objects with timestamp and value properties.
 * @returns {Object[]} An array of objects with timestamp and value for each data point.
 */
exports.generateCardDataPoints = (cards) =>
  cards
    .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    .flatMap((card) =>
      Array.from({ length: card.quantity }, () => ({
        num: card.price,
        timestamp: new Date(card.addedAt).toISOString(),
      }))
    );

exports.recalculatePriceHistory = (cardDataPoints) => {
  let totalValue = 0;
  return cardDataPoints.map((dataPoint) => {
    totalValue += dataPoint.num;
    return { num: totalValue, timestamp: dataPoint.timestamp };
  });
};

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
