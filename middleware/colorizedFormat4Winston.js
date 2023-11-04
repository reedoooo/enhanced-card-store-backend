const winston = require('winston');
const format = winston.format;
const { combine, timestamp, printf, colorize } = format;

// Custom format that colorizes logs based on a `section` property in the metadata
const colorizedFormat = printf(({ level, message, timestamp, meta }) => {
  let colorizedMessage = message;
  if (meta && meta.section) {
    switch (meta.section) {
      case 'id':
        colorizedMessage = `\x1b[36m${message}\x1b[0m`; // Cyan for 'id'
        break;
      case 'price':
        colorizedMessage = `\x1b[33m${message}\x1b[0m`; // Yellow for 'price'
        break;
      case 'chart_datasets':
        colorizedMessage = `\x1b[32m${message}\x1b[0m`; // Green for 'chart_datasets'
        break;
      // Add more sections and colors as needed
    }
  }
  return `[${timestamp}] ${level}: ${colorizedMessage}`;
});

// Initialize transports first
