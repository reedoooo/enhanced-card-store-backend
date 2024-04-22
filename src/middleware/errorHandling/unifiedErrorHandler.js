// src/middleware/errorHandlers.js
const logger = require('../../configs/winston');
require('colors');
// Mapping of error types to corresponding log levels
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
    return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
  }
  return error.message;
}
const logErrors = (err, req, res, next) => {
  const errorType = err.constructor.name;
  logger.error(
    `[[ERROR]` + `${errorType}] ${err.status || 500} - ${serializeError(err)} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  // const logLevel = errorTypes[errorType] || 'info';
  // logger[logLevel](
  //   `[[ERROR]`.red + `${errorType}] ${err.status || 500} - ${serializeError(err)} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  // );
  next(err); // Pass the error to the next middleware
};
function developmentErrors(err, req, res, next) {
  logErrors(err, req, res, next);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
		// data: err.message || 'Internal Server Error',
    error: err
  });
}
function productionErrors(err, req, res, next) {
  // if (handleDuplicateKeyError(err, req, res)) return;
  logErrors(err, req, res, next);
  res.status(err.status || 500).json({
    success: false,
    message: 'Error occurred',
		// data: err.message || 'Internal Server Error',
		error: err,
  });
}
function unifiedErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (process.env.NODE_ENV === 'development') {
    developmentErrors(err, req, res, next);
  } else {
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
