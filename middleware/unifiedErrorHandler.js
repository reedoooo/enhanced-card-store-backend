const CustomError = require('./customError');
const { logToSpecializedLogger } = require('./infoLogger');
require('colors');
// Handle the error and return a structured response
const handleError = (error, context = {}) => {
  // const section = context.section || 'error';
  // const logger = logToSpecializedLogger[section] || logToSpecializedLogger.error;

  if (error instanceof CustomError) {
    // logger.error(error.message, { ...context, stack: error.stack });
    logToSpecializedLogger('error', error.message, { ...context, stack: error.stack });
    return {
      status: error.status,
      message: error.message,
    };
  }

  // Use logError from loggingUtils for consistency
  // logError(error, 'SERVER_ERROR', { ...context, error }, { section: section });
  console.error('Error logging price change:', error);

  return {
    status: error.status || 500,
    message: error.message || 'An unexpected error occurred',
  };
};

// Unified error handler for Express.js
const unifiedErrorHandler = (error, req, res, next) => {
  const { status, message } = handleError(error, { req });

  if (res.headersSent) {
    return next(error);
  }

  res.status(status).json({ message });
};

module.exports = unifiedErrorHandler;
