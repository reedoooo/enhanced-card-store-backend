const morgan = require("morgan");
const logger = require("../../configs/winston");
morgan.token("json", (req, res) => {
  return JSON.stringify({
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    contentLength: res.get("content-length"),
    responseTime: res.get("response-time"),
  });
});

const morganMiddleware = morgan(":json", {
  stream: {
    write: (message) => {
      // Parse the JSON string and pass the object to Winston
      const data = JSON.parse(message);
      // Use an appropriate log level based on HTTP status code
      if (data.status >= 500) {
        logger.error("HTTP Error", data);
      } else if (data.status >= 400) {
        logger.warn("HTTP Warning", data);
      } else {
        logger.info("HTTP Info", data);
      }
    },
  },
});

// Correcting typo from modules.exports to module.exports
module.exports = {
  morganMiddleware,
};
