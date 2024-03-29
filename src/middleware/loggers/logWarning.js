// src/middleware/logRequests.js
const logger = require("../../configs/winston");
require("colors");

const logWarnings = (err, req, res, next) => {
	logger.warn(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: process.env.NODE_ENV === "production"? {} : err.stack,
  });
};
const handleWarning = (warning, message) => {
  logger.warn("[WARNING] ".yellow + message, warning);
  throw new Error(message);
};

module.exports = { logWarnings, handleWarning };