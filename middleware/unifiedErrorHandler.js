const {
  logToAllSpecializedLogger,
  logToAllSpecializedLoggers,
  specializedLoggers,
  directResponse,
  loggers,
} = require('./infoLogger');
const { handleError } = require('./handleErrors');

const unifiedErrorHandler = (error, req, res, next) => {
  // Log the error to all specialized loggers
  logToAllSpecializedLoggers('error', error.message, { section: 'error', error }, 'error');
  logToAllSpecializedLoggers('info', 'TEST LOG', { section: 'info' }, 'info');
  // Check if logger has transports before logging the error
  if (loggers.transports.length === 0) {
    console.error('No transports found for logger. Add a transport before using.');
  } else {
    // Log the error with context for more detailed debugging
    loggers.error(error.message, { error });
  }

  // Handle the error and extract status and message
  const { status, message } = handleError(error, { section: 'error', req });

  // If the headers are already sent, delegate to the default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Send the error response
  res.status(status).json({ message });
};

module.exports = unifiedErrorHandler;
