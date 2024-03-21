const logger = require("../../configs/winston");
require("colors");
// Mapping of error types to corresponding log levels
const errorTypes = {
  ValidationError: "warn",
  AuthError: "error",
  DatabaseError: "error",
  NotFoundError: "warn",
  ForbiddenError: "error",
  UnknownError: "info",
  BadRequestError: "warn",
  UnauthorizedError: "warn",
  ConflictError: "warn",
  UnprocessableEntityError: "warn",
  TooManyRequestsError: "warn",
  InternalServerError: "error",
  ServiceUnavailableError: "warn",
  GatewayTimeoutError: "warn",
};

// Serialize error object to include non-enumerable properties
function serializeError(error) {
  return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
}

// Function to log errors based on their types and severity
const logErrors = (err, req, res, next) => {
  const errorType = err.constructor.name;
  const logLevel = errorTypes[errorType] || "info"; // Default to 'info' if not specified
  const errorDetails =
    process.env.NODE_ENV === "production" ? err.message : serializeError(err);
  logger[logLevel](
    `[${errorType}] ${err.status || 500} - ${errorDetails} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  next(err); // Pass the error to the next middleware
};

const unifiedErrorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  const status = error.status || 500;
  const message = error.message;
  const errorType = error.constructor.name;
  const logLevel = "error";
  logger[logLevel](
    `[${errorType}]`.red +
      `${status}`.white +
      `${serializeError(error)} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  res.status(status).json({
    message:
      process.env.NODE_ENV === "production" ? message : serializeError(error),
  });
};
module.exports = { logErrors, unifiedErrorHandler };
