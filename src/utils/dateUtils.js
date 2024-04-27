const { v4: uuidv4 } = require('uuid');
const logger = require('../configs/winston');
const {
  addDays,
  subMonths,
  differenceInDays,
  differenceInHours,
  parse,
  format,
  getYear,
  getMonth,
  getDate,
  eachDayOfInterval,
  subDays,
  subHours,
  parseISO,
} = require('date-fns');

const {
  DATE_TIME_RANGES,
  generateRangeStatConfigWithLabels,
  BASE_STAT_CONFIGS,
} = require('../configs/constants');

const moment = require('moment-timezone');
const { extendMoment } = require('moment-range');

const momentWithRange = extendMoment(moment);
momentWithRange.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
const timezone = 'America/Seattle';
const now = momentWithRange().tz(timezone);
moment.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');

// ! STEP ONE: Convert data from timestamp/num format to data point format.
/**
 * Converts an array of data with 'timestamp' and 'num' properties to a specified data point format.
 * @param {Array} data - The input data array, each object should have 'timestamp' and 'num' properties.
 * @param {string} type - The type of data point format ('date' or 'time').
 * @returns {Array} An array of data points formatted according to the specified type.
 */
function convertToDataPoints(data) {
  return data.map((item) => {
    const itemMoment = momentWithRange(item.timestamp).tz(timezone);
    const isWithin24Hours = now.diff(itemMoment, 'hours') <= 24;
    const labelFormat = isWithin24Hours ? 'HH:mm' : 'YYYY-MM-DD';
    return {
      label: itemMoment.format(labelFormat),
      id: uuidv4(),
      x: itemMoment.toISOString(),
      y: item.num,
    };
  });
}
/**
 * Filters data within a specified date or time range.
 *
 * @param {Array} data - The array of objects to filter, each should have a 'timestamp' property.
 * @param {Date} startRange - The start of the date/time range.
 * @param {Date} endRange - The end of the date/time range.
 * @param {string} type - The type of range, 'date' for daily or 'time' for hourly.
 * @returns {Array} An array of objects that fall within the specified range.
 */
function findDataInRange(data, startRange, endRange, type) {
  const differenceFunction = type === 'date' ? differenceInDays : differenceInHours;
  return data.filter((item) => {
    const itemMoment = momentWithRange(item.x).tz(timezone);
    const diffStart = differenceFunction(itemMoment, startRange);
    const diffEnd = differenceFunction(itemMoment, endRange);
    return diffStart >= 0 && diffEnd <= 0;
  });
}
function mapDataByDateOrTime(data, type) {
  const formatString = type === 'date' ? 'YYYY-MM-DD' : 'HH:mm';
  let dataMap = new Map();

  data.forEach((item) => {
    const itemMoment = momentWithRange(item.x).tz(timezone).format(formatString);
    if (!dataMap.has(itemMoment)) {
      dataMap.set(itemMoment, []);
    }
    dataMap.get(itemMoment).push(item);
  });

  return Array.from(dataMap, ([key, value]) => ({ date: key, data: value }));
}
function processDataForRanges(data) {
  const results = {};

  DATE_TIME_RANGES.forEach((range) => {
    const { id, points, color } = range;
    const type = id.endsWith('d') ? 'date' : 'time';
    let startRange = now.clone().subtract(points, type === 'date' ? 'days' : 'hours');
    let endRange = now.clone();

    const timeFormat = type === 'date' ? 'YYYY-MM-DD' : 'HH:mm';
    let allTimes = Array.from(
      momentWithRange.range(startRange, endRange).by(type === 'date' ? 'day' : 'hour'),
    );
    let lastY = null; // Variable to hold the last known Y value
    let lastX = null; // Variable to hold the last known X value
    let initialYFound = false;
    let newpoint = false;

    let mappedData = allTimes.map((time) => {
      const timeStr = time.format(timeFormat);
      const found = data.find(
        (d) => momentWithRange(d.x).tz(timezone).format(timeFormat) === timeStr,
      );
      if (found) {
        lastY = found.y; // Update lastY with the found value
        lastX = found.x; // Update lastX with the found value
        initialYFound = true;
        newpoint = true;
        return { ...found };
      } else {
        if (!initialYFound && lastY === null) {
          // Find the first available y value if not already set
          const firstDataWithY = data.find((d) => d.y != null);
          lastY = firstDataWithY ? firstDataWithY.y : 0;
        }
        newpoint = false;
        return {
          label: timeStr,
          id: uuidv4(),
          x: time.toISOString(),
          y: lastY || 0,
        };
      }
    });

    results[id] = {
      id: id,
      color: '#2e7c67', // You might want to set color based on specific conditions
      name: `Last ${points} ${type === 'date' ? 'Days' : 'Hours'}`,
      data: mappedData,
    };
  });

  return results;
}
const findStatsInRange = (dataInRange) => {
  if (!dataInRange.length) return null; // Return null or an empty object to signify no data

  const totalY = dataInRange.reduce((acc, item) => acc + item.y, 0);
  const initialY = dataInRange[0].y;
  return {
    highPoint: Math.max(...dataInRange.map((item) => item.y)),
    lowPoint: Math.min(...dataInRange.map((item) => item.y)),
    average: totalY / dataInRange.length,
    priceChange: totalY - initialY,
    percentageChange: ((totalY - initialY) / initialY) * 100,
    volume: totalY,
    volatility: dataInRange.reduce((acc, item) => acc + Math.abs(item.y - initialY), 0),
    avgPrice: totalY / dataInRange.length,
  };
};
const mapStatisticsToFormat = (stats, config) => {
  if (!stats) return null; // Return null if no statistics data is available

  return {
    name: config.name,
    label: config.label,
    value: stats[config.statKey], // Correctly map the statistic value based on the stat key
    color: config.color,
    axis: 'y',
    lineStyle: {
      stroke: config.color,
      strokeWidth: 2,
    },
    legend: config.label,
    legendOrientation: 'horizontal',
  };
};
// const generateStatisticsForRanges = (dataPoints) => {
//   const results = {};
//   logger.info('Generating statistics for ranges...');
//   // const { newTotal, oldTotal, newQuantity, oldHighPoint, oldLowPoint } = newData;
//   DATE_TIME_RANGES.forEach((range) => {
//     const { id, points, color, type } = range;
//     let startRange = now.clone().subtract(points, type === 'date' ? 'days' : 'hours');
//     let endRange = now.clone();
//     const stats = findStatsInRange(findDataInRange(dataPoints, startRange, endRange, type));
//     logger.info(`Statistics for ${id}:`, stats);
//     const statConfigs = generateRangeStatConfigWithLabels(range);
//     logger.info(`Statistics configs for ${id}:`, statConfigs);
//     // const mappedData = statConfigs.map((config) => ({
//     //   ...config,
//     //   value: stats[config.statKey],
//     //   axis: 'y',
//     //   lineStyle: { stroke: config.color, strokeWidth: 2 },
//     //   legend: config.label,
//     //   legendOrientation: 'horizontal',
//     // }));
//     // logger.info(`Mapped data for ${id}:`, mappedData);
//     BASE_STAT_CONFIGS.map((config) => {
//       const updatedConfig = {
//         ...config,
//         label: `${config.label} in last ${range.points} ${range.type === 'date' ? 'Days' : 'Hours'}`,
//         color: range.color, // Assume color is passed correctly in `range`
//         value: stats[config.statKey],
//       };
//       let collectionStats = new Map();
//       collectionStats.set(config.name, mapStatisticsToFormat(stats, updatedConfig));
//       const mappedData = mapStatisticsToFormat(stats, updatedConfig);
//       logger.info(`Mapped data for ${id}:`, mappedData);
//       results[id] = {
//         id: id,
//         color: '#2e7c67', // This could be dynamically set if needed
//         name: `Last ${range.points} ${range.type === 'date' ? 'Days' : 'Hours'}`,
//         data: mappedData,
//       };
//     });
//     // results[id] = {
//     //   id: id,
//     //   color: '#2e7c67', // This could be dynamically set if needed
//     //   name: `Last ${range.points} ${range.type === 'date' ? 'Days' : 'Hours'}`,
//     //   data[]
//     // };
//   });

//   return results;
// };
const generateStatisticsForRanges = (dataPoints) => {
  const results = new Map(); // Use a Map to store results

  DATE_TIME_RANGES.forEach((range) => {
    const startRange = now.clone().subtract(range.points, range.type === 'date' ? 'days' : 'hours');
    const endRange = now.clone();
    const stats = findStatsInRange(findDataInRange(dataPoints, startRange, endRange, range.type));
    logger.info(`[generateStatisticsForRanges] Statistics for ${range.id}: ${stats}`);
    if (!stats) return; // Skip if no stats found

    const rangeStats = new Map();
    generateRangeStatConfigWithLabels(range).forEach((config) => {
      (config.label = `${config.name} in last ${range.points} ${range.type === 'date' ? 'Days' : 'Hours'}`),
        (config.color = range.color); // Assume color is passed correctly in `range`
      const formattedStat = mapStatisticsToFormat(stats, config);
      logger.info(`[generateStatisticsForRanges] FormattedStat for ${range.id}: ${formattedStat}`);
      if (formattedStat) rangeStats.set(config.name, formattedStat);
    });

    results.set(range.id, {
      id: range.id,
      color: range.color,
      name: `Last ${range.points} ${range.type === 'date' ? 'Days' : 'Hours'}`,
      data: rangeStats,
    });
  });

  return results;
};

module.exports = {
  convertToDataPoints,
  findDataInRange,
  mapDataByDateOrTime,
  processDataForRanges,
  generateStatisticsForRanges,
};
