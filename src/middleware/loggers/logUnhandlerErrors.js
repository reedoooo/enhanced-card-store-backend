const logger = require('../../configs/winston');

// Function to log unhandled rejections and uncaught exceptions
function logUnhandledErrors() {
  // Capture unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    // logger.error('[ERROR] Unhandled Rejection at Promise:', { promise: promise, reason: reason });
    logger.error('[ERROR] Unhandled Rejection at:', { promise, reason });

    // Depending on your context, you might want to exit or keep the process running
    // process.exit(1);
  });

  // Capture uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Exit process after logging. This is important because the state of the application
    // might be corrupted after an uncaught exception.
    process.exit(1);
  });

  // Optional: Capture other critical errors such as SIGTERM and SIGINT
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully.');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully.');
    process.exit(0);
  });
}

module.exports = logUnhandledErrors;
