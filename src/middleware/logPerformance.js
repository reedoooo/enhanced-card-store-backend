const { loggers } = require("./infoLogger");

// src/middleware/logPerformance.js
require("colors");
const logRequestDetails = (req, eventType, message, duration = null) => {
  const logInfo = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    section: eventType,
    message: message,
    data: {
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    },
  };

  if (duration !== null) {
    logInfo.duration = `${duration}ms`;
  }

  // if (req.body.cards) {
  //   logData(req.body.cards[0]);
  // }
  // if (req.body.card) {
  //   logData(req.body.card);
  // }
  // if (req.body.allXYValues) {
  //   logData("allXYValues", req.body.allXYValues[0]);
  // }
  // if (req.body.updatedCollection) {
  //   logData(req.body.updatedCollection);
  // }

  // logData('LOGGING REQUEST BODY', req.body);
};

const logPerformance = (req, res, next) => {
  const start = process.hrtime();
  console.log(
    "[START]".green + `Request ${req.id}: ${req.method} ${req.originalUrl}`
  );

  res.on("finish", () => {
    const duration = getDurationInMilliseconds(start);
    console.log("[END]".red + `Request ${req.id}: ${duration}ms`);
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
