// var util = require("../util");
// var Aggregator = require("./aggregator");

// module.exports = function () {
//   // flatten arguments into a single array
//   var args = [].reduce.call(
//     arguments,
//     function (a, x) {
//       return a.concat(util.array(x));
//     },
//     []
//   );
//   // create and return an aggregator
//   return new Aggregator().groupby(args).summarize({ "*": "values" });
// };
// const util = require("./util");
// const Aggregator = require("./aggregator");

/**
 * Filters the price history data based on the provided time ranges.
 *
 * @param {Array} timeRanges - An array of objects representing time ranges, each with a label and threshold.
 * @param {Array} priceHistory - An array of price history data points, each with a timestamp.
 * @returns {Map} A map where each time range contains the corresponding data points within that range.
 */
function filterPriceHistoryByTimeRanges(timeRanges, priceHistory) {
  // Initialize the aggregator instance.
  const aggregator = new Aggregator();

  // Process each time range to filter and aggregate the relevant data points.
  const result = timeRanges?.reduce((acc, { label, threshold }) => {
    // Define the lower time limit for this time range.
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - threshold);

    // Filter the price history data points within the specified time range.
    const filteredData = priceHistory?.filter(({ timestamp }) => {
      const dataPointDate = new Date(timestamp);
      return dataPointDate >= thresholdDate;
    });

    // Use the aggregator to summarize the filtered data.
    const aggregatedData = aggregator
      ?.groupby(filteredData)
      .summarize({ "*": "values" });

    // Map the aggregated data to the corresponding time range label.
    acc.set(label, aggregatedData);

    return acc;
  }, new Map());

  return result;
}

module.exports = filterPriceHistoryByTimeRanges;
