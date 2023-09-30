// utils.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { default: rateLimit } = require('express-rate-limit');
const SECRET_KEY = process.env.SECRET_KEY;

const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

function createToken(payload) {
  console.log('Debug SECRET_KEY: ', process.env.SECRET_KEY); // Debug line
  return jwt.sign(payload, process.env.SECRET_KEY);
}

// rateLimiter Middleware
const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many requests created from this IP, please try again after a minute',
});

// Middleware to handle async functions
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  validatePassword,
  createToken,
  postLimiter,
  asyncHandler,
};
