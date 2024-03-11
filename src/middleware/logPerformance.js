require("colors");
const logger = require("../configs/winston");

const logRequestDetails = (req, eventType, message, duration = null) => {
  const logInfo = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    eventType,
    message,
    status: req.res ? req.res.statusCode : undefined,
    duration: duration !== null ? `${duration}ms` : undefined,
    data: {
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    },
  };

  // Determine the log level based on response status
  const level =
    logInfo.status >= 500 ? "error" : logInfo.status >= 400 ? "warn" : "info";

  // Log the request details using Winston
  logger.log(level, `${eventType} ${message}`, logInfo);
};

const logPerformance = (req, res, next) => {
  const start = process.hrtime();
  logger.info(`[START] Request ${req.id}: ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const duration = getDurationInMilliseconds(start);
    logger.info(`[END] Request ${req.id}: ${duration}ms`);
    logRequestDetails(
      req,
      "completed",
      `Request completed with status ${res.statusCode}`,
      duration
    );
  });

  next();
};

function getDurationInMilliseconds(start) {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}

module.exports = logPerformance;
