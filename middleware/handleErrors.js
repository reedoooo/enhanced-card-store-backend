const winston = require('winston');
const CustomError = require('./customError');

const handleError = (error, context = {}) => {
  if (error instanceof CustomError) {
    winston.error('Error:', error.message, '\nContext:', error.context, '\nStack:', error.stack);
    return {
      status: error.status,
      message: error.message,
    };
  }

  winston.error('Error:', error.message, '\nContext:', context, '\nStack:', error.stack);
  return { status: 500, message: 'An unexpected error occurred' };
};

module.exports = { handleError };
