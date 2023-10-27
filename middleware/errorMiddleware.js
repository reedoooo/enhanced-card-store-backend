const { handleError } = require('./handleErrors');

const handleErrors = (err, req, res, next) => {
  const { status, message } = handleError(err);
  res.status(status).json({ message });
};

module.exports = handleErrors;
