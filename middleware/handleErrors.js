const CustomError = require('./customError');
const { specializedLoggers } = require('./infoLogger');

const handleError = (error, context = {}) => {
  // Determine the appropriate logger based on context or default to 'error' logger
  if (!specializedLoggers || typeof specializedLoggers.error !== 'function') {
    console.error('Logger not defined or does not have an error function');
    return;
  }
  const section = context.section || 'error';
  const logger = specializedLoggers[section] || specializedLoggers.error;

  if (error instanceof CustomError) {
    logger.error(error.message, { ...context, stack: error.stack });
    return {
      status: error.status,
      message: error.message,
    };
  }
  logger(error);

  // logger.error(error.message, { ...context, stack: error.stack });

  // Assuming error has status and message properties you want to return
  // If not, you should set default ones
  return {
    status: error.status || 500, // Defaulting to 500 if error.status is not set
    message: error.message || 'An unexpected error occurred',
  };
};

module.exports = { handleError };
