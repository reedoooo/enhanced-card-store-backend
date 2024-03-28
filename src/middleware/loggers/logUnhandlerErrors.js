const logger = require("../../configs/winston");

// Function to log unhandled rejections and uncaught exceptions
function logUnhandledErrors() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1); // Exit process after logging
  });
}

module.exports = logUnhandledErrors;