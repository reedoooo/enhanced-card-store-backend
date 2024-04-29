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
module.exports = {
	greenLogBracks,
  redLogBracks,
  yellowLogBracks,
  blueLogBracks,
  orangeLogBracks,
  purpleLogBracks,
	whiteLogBracks,
};