// src/middleware/errorHandler.js
const logger = require("../../configs/winston");
require("colors");

const errorHandler = (err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: process.env.NODE_ENV === "production" ? {} : err.stack,
  });
};
const handleError = (error, message) => {
  logger.error("[ERROR] ".red + message, error);
  throw new Error('['.red + message + ']'.red + ' ' + error.message);
};
module.exports = { errorHandler, handleError };
