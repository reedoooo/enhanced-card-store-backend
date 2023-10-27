class CustomError extends Error {
  constructor(message, status = 500, isOperational = true, context = {}) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.status = status;
    this.isOperational = isOperational;
    this.context = context;
  }
}

module.exports = CustomError;
