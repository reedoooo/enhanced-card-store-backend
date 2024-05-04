const { v4: uuidv4 } = require('uuid');
const logger = require('../configs/winston');
const { DATE_TIME_RANGES, BASE_STAT_CONFIGS } = require('../configs/constants');

const moment = require('moment-timezone');
const { extendMoment } = require('moment-range');
const momentWithRange = extendMoment(moment);
momentWithRange.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
const timezone = 'America/Seattle';
moment.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');

const createNewPriceEntry = (price, time) => {
  const newTimeStampValue = moment().tz(timezone).toISOString();
  const stampValue = time ? moment(time).tz(timezone).toISOString() : newTimeStampValue;
  return {
    num: price,
    timestamp: stampValue,
  };
};

const generateSingleCardPriceEntries = (card) => {
  return Array.from({ length: card.quantity }, (_, index) => ({
    num: card.price,
    timestamp: moment(card.addedAt).tz(timezone).toISOString(),
  }));
};

const generateCardDataPoints = (cards, timezone) => {
  return cards
    .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    .flatMap((card) => generateSingleCardPriceEntries(card));
};

const calculateValueHistory = (cardDataPoints) => {
  let totalValue = 0;
  return cardDataPoints.map((dataPoint) => {
    const pointMoment = moment(dataPoint.timestamp).tz(timezone);
    totalValue += dataPoint.num;
    return {
      num: totalValue,
      timestamp: pointMoment.toISOString(),
    };
  });
};
function convertSingleDataPoint(item, now) {
  const pointMoment = moment(item.timestamp).tz(timezone);
  const isWithin24Hours = pointMoment.isAfter(now.clone().subtract(24, 'hours'));
  const labelFormat = isWithin24Hours ? 'HH:mm' : 'YYYY-MM-DD';
  const label = pointMoment.format(labelFormat);
  const xValue = pointMoment.toISOString();

  return {
    label: label,
    id: uuidv4(),
    x: xValue,
    y: item.num,
  };
}
function convertToDataPoints(data) {
  const now = moment().tz(timezone);
  return data.map((item) => convertSingleDataPoint(item, now));
}

function mapDataByDateOrTime(data, type) {
  const formatString = type === 'date' ? 'YYYY-MM-DD' : 'HH:mm';
  let dataMap = new Map();
  data.forEach((item) => {
    const itemMoment = moment(item.x).tz(timezone).format(formatString);
    if (!dataMap.has(itemMoment)) {
      dataMap.set(itemMoment, []);
    }
    dataMap.get(itemMoment).push(item);
  });
  return Array.from(dataMap, ([key, value]) => ({ date: key, data: value }));
}
function processDataForRanges(data, totalPrice) {
  const results = {};
  const now = moment().tz(timezone);

  DATE_TIME_RANGES.forEach((range) => {
    const timeFormat = range.type === 'date' ? 'YYYY-MM-DD' : 'HH:mm';

    const startRange = now.clone().subtract(range.points, range.type === 'date' ? 'days' : 'hours');
    const endRange = now.clone();
    // logger.info(`[START RANGE: ${startRange}][END RANGE: ${endRange}]`);
    let allTimes = Array.from(
      momentWithRange.range(startRange, endRange).by(range.type === 'date' ? 'day' : 'hour'),
    );
    let mappedData = allTimes.map((time) => ({
      label: time.format(timeFormat),
      id: uuidv4(),
      x: time.toISOString(),
      y: 0,
    }));
    let dataInRange = data
      .filter((d) => {
        const dataMoment = moment(d.x).tz(timezone);
        return dataMoment.isBetween(startRange, endRange, null, '[]');
      })
      .sort((a, b) => moment(a.x).valueOf() - moment(b.x).valueOf());
    if (dataInRange.length > 0) {
      mappedData.forEach((slot, index) => {
        const closestData = dataInRange.find((d) => {
          const slotMoment = moment(slot.x);
          const dataMoment = moment(d.x)
            .tz(timezone)
            .startOf(range.type === 'date' ? 'day' : 'hour');
          return dataMoment.isSame(slotMoment, range.type === 'date' ? 'day' : 'hour');
        });

        if (closestData) {
          slot.y = closestData.y;
          // logger.info(`[CLOSEST DATA][${closestData.y}]`);
        } else {
          const lastKnownY = index > 0 ? mappedData[index - 1].y : 0;
          slot.y = lastKnownY;
        }
      });
    }
    if (mappedData.length > 0) {
      mappedData[mappedData.length - 1].y = totalPrice;
    }
    results[range.id] = {
      id: range.id,
      color: '#2e7c67', // Placeholder color, set according to your application's needs
      name: `Last ${range.points} ${range.type === 'date' ? 'Days' : 'Hours'}`,
      data: mappedData,
    };
  });

  return results;
}

const findStatsInRange = (dataInRange, totalPrice, totalQuantity) => {
  if (!dataInRange.length) {
    logger.info(`[NO DATA FOUND IN RANGE]`.red);
    return new Map(); // Return an empty Map if no data
  }
  const totalY = dataInRange.reduce((acc, item) => acc + item?.y, 0);
  const finalY = dataInRange[dataInRange.length - 1]?.y || 0; // Ensure we handle undefined
  const initialY = dataInRange[0]?.y || 0; // Ensure we handle undefined
  const indexOfFirstNonZeroY = dataInRange?.findIndex((item) => item?.y !== 0);
  const firstNonZeroY = dataInRange[indexOfFirstNonZeroY]?.y;
  const priceChange = totalPrice - firstNonZeroY;
  // logger.info(`[TOTAL Y] ${totalY}`);
  // logger.info(`[INITIAL Y] ${initialY}`);
  // logger.info(`[FINAL Y] ${finalY}`);
  // logger.info(`[FIRST NON ZERO Y] ${firstNonZeroY}`);
  const statsMap = new Map([
    ['highPoint', Math.max(...dataInRange.map((item) => item.y))],
    ['lowPoint', Math.min(...dataInRange.map((item) => item.y))],
    ['average', totalY / dataInRange.length],
    ['priceChange', finalY - initialY],
    ['percentageChange', ((finalY - initialY) / initialY) * 100], // Corrected formula
    // ['percentageChange', (totalPrice / priceChange) * 100],
    ['volume', totalQuantity],
    ['volatility', dataInRange.reduce((acc, item) => acc + Math.abs(item.y - initialY), 0)],
    ['avgPrice', totalPrice / totalQuantity],
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

const generateStatisticsForRanges = (dataPoints, chartKey, totalPrice, totalQuantity) => {
  const results = new Map(); // Use a Map to store results
  const range = DATE_TIME_RANGES.find((r) => r.id === chartKey);
  const now = moment().tz(timezone);
  const startRange = now.clone().subtract(range.points, range.type === 'date' ? 'days' : 'hours');
  const endRange = now.clone();
  let allTimes = Array.from(
    momentWithRange.range(startRange, endRange).by(range.type === 'date' ? 'day' : 'hour'),
  );
  let dataWithDefaults = allTimes.map((time) => {
    // Prepare a default structure for each slot
    return {
      label: time.format(range.type === 'date' ? 'YYYY-MM-DD' : 'HH:mm'),
      id: uuidv4(),
      x: time.toISOString(),
      y: 0, // Default y value
    };
  });
  dataPoints.forEach((dataPoint) => {
    const pointMoment = moment(dataPoint.x).tz(timezone);
    const closestSlot = dataWithDefaults.find((slot) => {
      return moment(slot.x)
        .tz(timezone)
        .isSame(pointMoment, range.type === 'date' ? 'day' : 'hour');
    });

    if (closestSlot) {
      closestSlot.y = dataPoint.y; // Assign data point y to the closest slot
    }
  });
  let finalY = null;
  let lastKnownY = 0;
  dataWithDefaults.forEach((slot) => {
    if (slot.y !== 0) {
      lastKnownY = slot.y;
    } else {
      slot.y = lastKnownY; // Carry forward the last known y value if no new value is present
    }
  });
  BASE_STAT_CONFIGS.forEach((config) => {
    const formattedStat = mapStatisticsToFormat(
      findStatsInRange(dataWithDefaults, totalPrice, totalQuantity),
      config,
    );
    if (formattedStat) {
      // logger.info(`[STAT FOUND] [${config.name}] [${formattedStat.value}]`.green);
      results.set(config.name, formattedStat);
    }
  });
  return results;
};

module.exports = {
  generateCardDataPoints,
  calculateValueHistory,
  convertSingleDataPoint,
  convertToDataPoints,
  mapDataByDateOrTime,
  processDataForRanges,
  generateStatisticsForRanges,
  createNewPriceEntry,
  generateSingleCardPriceEntries,
};
