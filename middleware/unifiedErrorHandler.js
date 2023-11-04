const { logger } = require('./infoLogger.js');
const { handleError } = require('./handleErrors');

const unifiedErrorHandler = (error, req, res, next) => {
  // Check if logger has transports before logging the error
  if (logger.transports.length === 0) {
    // Log to console if no transports found, this is for debugging
    console.error('No transports found for logger. Add a transport before using.');
  } else {
    // Log the error if transports are set up
    logger.error('Error:', error);
  }

  // Handle the error and extract status and message
  const { status, message } = handleError(error);

  // If the headers are already sent, delegate to the default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Send the error response
  res.status(status).json({ message });
};

module.exports = unifiedErrorHandler;
