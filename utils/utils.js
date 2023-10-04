// utils.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { default: rateLimit } = require('express-rate-limit');
const User = require('../models/User');
const SECRET_KEY = process.env.SECRET_KEY;

const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

function createToken(payload) {
  console.log('Debug SECRET_KEY: ', SECRET_KEY); // Debug line
  return jwt.sign(payload, SECRET_KEY);
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

const roundMoney = (value) => {
  return parseFloat(value.toFixed(2));
};

// Additional helper functions that single out logic
const ensureNumber = (value) => Number(value);

const findUserById = async (userId) => {
  const users = await User.find();
  return users.find((user) => user._id.toString() === userId);
};

const calculatePriceDifference = (initialPrice, updatedPrice) => initialPrice - updatedPrice;

const calculateNewTotalPrice = (totalPrice, priceDifference) => totalPrice + priceDifference;

const splitDateTime = (date) => {
  // Your implementation of splitting date and time based on your format
  return {
    date: date.toISOString().split('T')[0], // e.g., "2023-05-01"
    time: date.toTimeString().split(' ')[0], // e.g., "12:01:35"
  };
};

module.exports = {
  validatePassword,
  createToken,
  postLimiter,
  asyncHandler,
  splitDateTime,
  roundMoney,
  ensureNumber,
  findUserById,
  calculatePriceDifference,
  calculateNewTotalPrice,
};
