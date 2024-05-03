// src/middleware/errorHandlers.js
const logger = require('../../configs/winston');
require('colors');
const errorTypes = {
  ValidationError: 'warn',
  AuthError: 'error',
  DatabaseError: 'error',
  NotFoundError: 'warn',
  ForbiddenError: 'error',
  UnknownError: 'info',
  BadRequestError: 'warn',
  UnauthorizedError: 'warn',
  ConflictError: 'warn',
  UnprocessableEntityError: 'warn',
  TooManyRequestsError: 'warn',
  InternalServerError: 'error',
  ServiceUnavailableError: 'warn',
  GatewayTimeoutError: 'warn',
};
function serializeError(error) {
  if (process.env.NODE_ENV !== 'production') {
    const errorDetails = {
      message: error.message, // Standard error message
      name: error.name, // Type of error (e.g., TypeError)
      stack: error.stack, // Stack trace for debugging
      status: error.status || 500, // HTTP status code (default to 500)
      functionName: error.stack.split('\n')[1].trim().split(' ')[1], // Function name, if applicable
    };

    Object.getOwnPropertyNames(error).forEach((key) => {
      errorDetails[key] = error[key];
    });
    return JSON.stringify(errorDetails);
  }
  return { message: error.message };
}
const logErrors = (err, req, res, next) => {
  const errorType = err.constructor.name;
  logger.error(
    `[`.red +
      `${errorType}` +
      `]`.red +
      `[`.red +
      `${err.status || 500}` +
      `]`.red +
      `[`.red +
      `${req.originalUrl}` +
      `]`.red +
      `[`.red +
      `${req.method}` +
      `]`.red +
      `[`.red +
      `${req.ip}` +
      `]`.red,
  );
  // next(err); // Pass the error to the next middleware
  res.status(err.status || 500).json(serializeError(err));
  
};
function developmentErrors(err, req, res, next) {
  logErrors(err, req, res, next);
}
function productionErrors(err, req, res, next) {
  logErrors(err, req, res, next);
}
function unifiedErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    logger.warn(`[HEADERS SENT] ${res.headersSent}`);
    return next(err);
  }
  if (process.env.NODE_ENV === 'development') {
    logger.warn(`[ERROR IN DEVELOPMENT]`.yellow);
    developmentErrors(err, req, res, next);
  } else {
    logger.warn(`[ERROR IN PRODUCTION]`.yellow);
    productionErrors(err, req, res, next);
  }
}
function notFound(req, res, next) {
  const message = "Api url doesn't exist";
  logger.warn(`404 - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(404).json({
    success: false,
    message,
  });
}
module.exports = { unifiedErrorHandler, notFound };
