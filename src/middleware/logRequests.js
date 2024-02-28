// src/middleware/logRequests.js
const logger = require("../configs/winston");

const logRequests = (req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

module.exports = logRequests;
