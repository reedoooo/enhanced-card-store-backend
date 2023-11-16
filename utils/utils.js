// utils.js
// const { default: rateLimit } = require('express-rate-limit');
const { default: mongoose } = require('mongoose');
const { GENERAL } = require('../constants');
const CustomError = require('../middleware/customError');
const User = require('../models/User');

// // rateLimiter Middleware
// const postLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 10,
//   message: 'Too many requests created from this IP, please try again after a minute',
// });

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      next(error);
    });
  };
}

const convertUserIdToObjectId = (userId) => {
  try {
    return mongoose.Types.ObjectId(userId);
  } catch (error) {
    throw new CustomError('Failed to convert user ID to ObjectId', 400, true, {
      function: 'convertUserIdToObjectId',
      userId,
      error: error.message,
      stack: error.stack,
    });
  }
};

const roundMoney = (value) => {
  return parseFloat(value.toFixed(2));
};

// Additional helper functions that single out logic
const ensureNumber = (value) => Number(value);

const findUserById = async (userId) => {
  const users = await User.find();
  return users.find((user) => user._id.toString() === userId);
};

const findUser = async (username) => {
  return await User.findOne({ 'login_data.username': username });
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

async function updateDocumentWithRetry(model, update, options = {}, retryCount = 0) {
  try {
    // Try to update the document
    const updated = await model.findOneAndUpdate({ _id: update._id }, update, {
      new: true,
      runValidators: true,
      ...options,
    });
    return updated;
  } catch (error) {
    if (error.name === 'VersionError' && retryCount < GENERAL.MAX_RETRIES) {
      // Fetch the latest document and apply your update again
      const doc = await model.findById(update._id);
      if (doc) {
        // Reapply the updates to the document...
        return updateDocumentWithRetry(
          model,
          { ...doc.toObject(), ...update },
          options,
          retryCount + 1,
        );
      }
    }
    throw error;
  }
}

module.exports = {
  // postLimiter,
  findUser,
  asyncHandler,
  splitDateTime,
  roundMoney,
  ensureNumber,
  findUserById,
  calculatePriceDifference,
  calculateNewTotalPrice,
  updateDocumentWithRetry,
  convertUserIdToObjectId,
};
