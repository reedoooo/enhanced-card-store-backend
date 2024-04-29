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
    const { id, points, color, type } = range;
    // const type = id.endsWith('d') ? 'date' : 'time';
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
const findStatsInRange = (dataInRange, totalPrice, firstNonZeroY, indexOfFirstNonZeroY) => {
  if (!dataInRange.length) {
    logger.info(`[NO DATA FOUND IN RANGE]`.red);
    return new Map(); // Return an empty Map if no data
  }
  // logger.info(`[DATA] ${JSON.stringify(dataInRange)}`);
  const totalY = dataInRange.reduce((acc, item) => acc + item.y, 0);
  logger.info(`[TOTAL Y] ${totalY}`);
  const initialY = dataInRange[1].y;
  logger.info(`[INITIAL Y] ${initialY}`);
  logger.info(`[FIRST NON ZERO Y] ${firstNonZeroY}`);
  logger.info(`[INDEX OF FIRST NON ZERO Y] ${indexOfFirstNonZeroY}`);
  const priceChange = totalY - initialY;
  logger.info(`[PRICE CHANGE] ${priceChange}`);
  logger.info(`[PERCENTAGE CHANGE] ${totalPrice / priceChange}`);
  const statsMap = new Map([
    ['highPoint', Math.max(...dataInRange.map((item) => item.y))],
    ['lowPoint', Math.min(...dataInRange.map((item) => item.y))],
    ['average', totalY / dataInRange.length],
    ['priceChange', priceChange],
    ['percentageChange', totalPrice / priceChange],
    ['volume', totalY],
    ['volatility', dataInRange.reduce((acc, item) => acc + Math.abs(item.y - initialY), 0)],
    ['avgPrice', totalY / dataInRange.length],
  ]);
  return statsMap;
};
const mapStatisticsToFormat = (stats, config) => {
  if (!stats || !stats.has(config.statKey)) {
    logger.info(`[NO STATS FOUND] [${config.statKey}]`.red);
    return null; // Return null if no statistic is found
  }

  return {
    name: config.name,
    id: config.id,
    label: config.label,
    value: stats.get(config.statKey), // Retrieve the statistic value from the Map based on the stat key
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
const generateStatisticsForRanges = (dataPoints, chartKey, totalPrice) => {
  if (chartKey === undefined) {
    chartKey = '24hr';
  }
  // if (!dataPoints || !dataPoints.length || !chartKey) {
  //   logger.info(`[NO DATA OR NO CHART KEY PROVIDED] [${dataPoints.length}][${chartKey}]`.red);
  //   return new Map(); // Return an empty Map if no data or no chartKey
  // }
  const results = new Map(); // Use a Map to store results
  // logger.info(`[KEY] ${chartKey}`);
  const range = DATE_TIME_RANGES.find((r) => r.id === chartKey);
  if (!range) {
    logger.error(`No range found for the provided key: ${chartKey}`.red);
    return results; // Exit if no range matches the chartKey
  }
  const startRange = now.clone().subtract(range.points, range.type === 'date' ? 'days' : 'hours');
  const endRange = now.clone();
  let allTimes = Array.from(
    momentWithRange.range(startRange, endRange).by(range.type === 'date' ? 'day' : 'hour'),
  );
  let firstNonZeroY = null;
  let indexOfFirstNonZeroY = null;
  const dataInRange = allTimes.map((time) => {
    const timeStr = time.format(range.format);
    const found = dataPoints.find(
      (d) => momentWithRange(d.x).tz(timezone).format(range.format) === timeStr,
    );

    if (found && found.y !== 0 && firstNonZeroY === null) {
      firstNonZeroY = found.y; // Set firstNonZeroY if not already set and current y is non-zero
      indexOfFirstNonZeroY = allTimes.indexOf(time);
    }

    return found ? { ...found } : { label: timeStr, id: uuidv4(), x: time.toISOString(), y: 0 };
  });
  BASE_STAT_CONFIGS.forEach((config) => {
    const formattedStat = mapStatisticsToFormat(findStatsInRange(dataInRange, totalPrice, firstNonZeroY, indexOfFirstNonZeroY), config);
    // logger.info(
    //   `[FORMATTED STAT][${formattedStat.label}]` + `[` + `${formattedStat.value}`.green + `]`,
    // );
    if (formattedStat) {
      results.set(config.name, formattedStat);
    }
  });
  return results;
};

module.exports = {
  convertToDataPoints,
  mapDataByDateOrTime,
  processDataForRanges,
  generateStatisticsForRanges,
};
