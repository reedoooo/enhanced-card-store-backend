const winston = require('winston');

const handleErrors = (err, req, res, next) => {
  let status = 500;
  let message = 'An unexpected error occurred';

  switch (err.name) {
    case 'ValidationError':
      status = 400;
      message = err.message;
      break;
    case 'MongoError':
      status = 400;
      message = 'Database error';
      break;
    default:
      winston.error('Unhandled error:', err);
  }

  res.status(status).json({ message });
};

module.exports = handleErrors;
