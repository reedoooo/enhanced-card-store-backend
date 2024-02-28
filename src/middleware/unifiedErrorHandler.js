const CustomError = require('./customError');
const { logToSpecializedLogger } = require('./infoLogger');
require('colors');

// Serialize error objects for logging
function serializeError(error) {
  return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
}

// Improved handleError function
const handleError = (err, context = {}) => {
  let error = {
    status: 500,
    message: 'An unexpected error occurred',
    code: 'UNEXPECTED_ERROR',
  };

  if (err instanceof CustomError) {
    error = { status: err.status, message: err.message, code: err.code };
  } else if (err instanceof Error) {
    error.message = err.message;
    error.stack = err.stack;

    if (err.code === 11000) {
      error.message = 'Email or Username Already exists';
      error.status = 400;
    } else if (err.message.includes('validation error')) {
      error.status = 422;
      const errors = Object.values(err.errors || {});
      error.field = errors[0]?.path || 'Unknown';
      error.message = errors[0]?.message || error.message;
    }
  }

  logToSpecializedLogger('error', error.message, { ...context, error: serializeError(err) });
  return error;
};

// Unified error handler for Express.js
const unifiedErrorHandler = (error, req, res, next) => {
  const { status, message } = handleError(error, { req });

  if (res.headersSent) {
    return next(error);
  }

  res.status(status).json({ message });
};

function errorHandler(err) {
  const { code, message } = err;
  const error = { message: '' };
  if (code === 11000) {
    error.message = 'Email or Username Already exists';
  } else if (message.includes('user validation error')) {
    const errors = Object.values(err.errors);
    error.field = errors[0];
    error.message = errors[0].message;
  } else {
    error.message = err.message;
  }
  console.error(err);
  return error;
}

module.exports = {
  errorHandler,
  handleError,
  unifiedErrorHandler,
};
