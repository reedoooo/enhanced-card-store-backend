const { logError } = require('../utils/loggingUtils');
const CustomError = require('./customError');
const colors = require('colors');
const { loggers } = require('./infoLogger');

// Handle the error and return a structured response
const handleError = (error, context = {}) => {
  const section = context.section || 'error';
  const logger = loggers[section] || loggers.error;

  if (error instanceof CustomError) {
    logger.error(error.message, { ...context, stack: error.stack });
    return {
      status: error.status,
      message: error.message,
    };
  }

  logger.error(error.message, { ...context, stack: error.stack });

  return {
    status: error.status || 500,
    message: error.message || 'An unexpected error occurred',
  };
};

// Unified error handler for Express.js
const unifiedErrorHandler = (error, req, res, next) => {
  // Log the error to all specialized loggers
  // logError(error, error.message, { section: 'error', error }, 'error');

  const { status, message } = handleError(error, { req });

  if (res.headersSent) {
    return next(error);
  }

  res.status(status).json({ message });
};

module.exports = unifiedErrorHandler;
