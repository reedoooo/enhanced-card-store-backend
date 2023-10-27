const winston = require('winston');
const CustomError = require('./customError');

const logError = (error, context = {}) => {
  winston.error('Error:', error.message, '\nContext:', context, '\nStack:', error.stack);
};

const handleError = (error, context = {}) => {
  if (error instanceof CustomError) {
    logError(error, error.context);
    return {
      status: error.status,
      message: error.message,
    };
  }

  logError(error, context);
  return { status: 500, message: 'An unexpected error occurred' };
};

module.exports = { logError, handleError };
