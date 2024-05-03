// the below code fragment can be found in:
// src/utils/logUtils.js
require('colors');
const greenLogBracks = (message) => `[`.green + `${message}` + `]`.green;
const redLogBracks = (message) => `[`.red + `${message}` + `]`.red;
const yellowLogBracks = (message) => `[`.yellow + `${message}` + `]`.yellow;
const blueLogBracks = (message) => `[`.blue + `${message}` + `]`.blue;
const orangeLogBracks = (message) => `[`.orange + `${message}` + `]`.orange;
const purpleLogBracks = (message) => `[`.purple + `${message}` + `]`.purple;
const whiteLogBracks = (message) => `[`.white + `${message}` + `]`.white;
const logMapData = (map) => {
  if (map instanceof Map) {
    map.forEach((value, key) => {
      logger.info(`[Map Key: ${key}] [Map Value: ${JSON.stringify(value)}]`);
    });
  } else {
    logger.error(`[ERROR] Invalid collectionStatistics type: ${typeof collectionStatistics}`.red);
  }
};
module.exports = {
	greenLogBracks,
  redLogBracks,
  yellowLogBracks,
  blueLogBracks,
  orangeLogBracks,
  purpleLogBracks,
	whiteLogBracks,
	logMapData,
};