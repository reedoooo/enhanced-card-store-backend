const CustomError = require('./customError');
const { loggers, logToAllSpecializedLoggers } = require('./infoLogger');

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
  logToAllSpecializedLoggers('error', error.message, { section: 'error', error }, 'error');
  logToAllSpecializedLoggers('info', 'TEST LOG', { section: 'info' }, 'info');

  if (loggers.transports.length === 0) {
    console.error('No transports found for logger. Add a transport before using.');
  } else {
    loggers.error(error.message, { error });
  }

  const { status, message } = handleError(error, { section: 'error', req });

  if (res.headersSent) {
    return next(error);
  }

  res.status(status).json({ message });
};

module.exports = unifiedErrorHandler;
