// src/middleware/errorHandler.js
const logger = require("../configs/winston");

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

module.exports = errorHandler;
