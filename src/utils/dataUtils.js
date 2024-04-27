const moment = require('moment-timezone');
const { extendMoment } = require('moment-range');

const momentWithRange = extendMoment(moment);
momentWithRange.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');
const timezone = 'America/Seattle';
const now = momentWithRange().tz(timezone);
const createNewPriceEntry = (price, time) => {
  const stampValue = time ? moment(time).tz(timezone).toISOString() : now.toISOString();
  return {
    num: price,
    timestamp: stampValue,
  };
};
/**
* Generates data points for a single card, each representing a price and a timestamp.
* The first data point uses the card's added timestamp, and subsequent data points use the updated timestamp.
* 
* @param {Object} card - The card object to generate data points for.
* @param {number} card.price - The price of the card.
* @param {number} card.quantity - The quantity of data points to generate, based on the card's quantity.
* @param {string} card.addedAt - The ISO string timestamp when the card was added.
* @param {string} card.updatedAt - The ISO string timestamp when the card was last updated.
* @returns {Array<Object>} An array of objects, each containing a `num` property for the card's price and a `timestamp` property for the ISO string timestamp.
*/
const generateSingleCardDataPoints = (card) => {
  return Array.from({ length: card.quantity }, (_, index) => ({
    num: card.price,
    timestamp:
      index === 0
        ? moment(card.addedAt).tz(timezone).toISOString()
        : moment(card.updatedAt).tz(timezone).toISOString(),
  }));
};

const generateCardDataPoints = (cards, timezone) => {
  return cards
    .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    .flatMap((card) => generateSingleCardDataPoints(card, timezone));
};

const recalculatePriceHistory = (cardDataPoints) => {
  let totalValue = 0;
  return cardDataPoints.map((dataPoint) => {
    totalValue += dataPoint.num;
    return {
      num: totalValue,
      timestamp: dataPoint.timestamp, // Assuming the input data points are already adjusted for timezone
    };
  });
};

module.exports = {
  generateSingleCardDataPoints,
  generateCardDataPoints,
  recalculatePriceHistory,
  createNewPriceEntry,
};
