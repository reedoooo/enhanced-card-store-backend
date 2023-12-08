// utils.js
// const { default: rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');
const { GENERAL, MESSAGES, STATUS } = require('../constants');
const CustomError = require('../middleware/customError');
const User = require('../models/User');
// const { logError } = require('./loggingUtils');
const { default: axios } = require('axios');
const { validationResult } = require('express-validator');
const { logToAllSpecializedLoggers } = require('../middleware/infoLogger');
const { logError } = require('./loggingUtils');
const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});
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

const ensureNumber = (value) => Number(value);
const ensureString = (value) => String(value);
const ensureBoolean = (value) => Boolean(value);
const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureObject = (value) => (typeof value === 'object' ? value : {});

const validateVarType = (value, type) => {
  switch (type) {
    case 'number':
      return ensureNumber(value);
    case 'string':
      return ensureString(value);
    case 'boolean':
      return ensureBoolean(value);
    case 'array':
      return ensureArray(value);
    case 'object':
      return ensureObject(value);
    default:
      return value;
  }
};

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

const respondWithError = (res, status, message, errorDetails) => {
  console.error(message, errorDetails);
  logError(message, errorDetails);
  res.status(status).json({ message, errorDetails });
};

const getCardInfo = async (cardId) => {
  try {
    const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    return data.data[0];
  } catch (error) {
    console.error(`Error fetching card info for card ID ${cardId}:`, error);
    throw error;
  }
};

const convertPrice = (price) => {
  if (typeof price === 'string') {
    const convertedPrice = parseFloat(price);
    if (isNaN(convertedPrice)) throw new Error(`Invalid price value: ${price}`);
    return convertedPrice;
  }
  return price;
};

const filterUniqueCards = (cards) => {
  const uniqueCardIds = new Set();
  return cards.filter((card) => {
    const cardId = typeof card.id === 'number' ? String(card.id) : card.id;
    if (!uniqueCardIds.has(cardId)) {
      uniqueCardIds.add(cardId);
      return true;
    }
    return false;
  });
};

const handleDuplicateYValuesInDatasets = (card) => {
  if (card.chart_datasets && Array.isArray(card.chart_datasets)) {
    const yValuesSet = new Set(
      card.chart_datasets.map((dataset) => dataset.data && dataset.data[0]?.xy?.y),
    );
    return card.chart_datasets.filter((dataset) => {
      const yValue = dataset.data && dataset.data[0]?.xy?.y;
      if (yValuesSet.has(yValue)) {
        yValuesSet.delete(yValue);
        return true;
      }
      return false;
    });
  }
  return card.chart_datasets;
};

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const handleValidationErrors = (req, res, next) => {
  // Handle validation errors which means that the request failed validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new CustomError(MESSAGES.VALIDATION_ERROR, STATUS.BAD_REQUEST, true, {
      validationErrors: errors.array(),
    });
    return next(error); // Pass the error to the next error-handling middleware
  }
  if (next) {
    next();
  }
};

// Enhanced error logging
// const logError = (message, error) => {
//   logToAllSpecializedLoggers('error', message, { section: 'errors', error }, 'log');
// };

// Enhanced info logging
const logInfo = (message, status, data) => {
  logToAllSpecializedLoggers(
    'info',
    status.green + ' | ' + message,
    { section: 'info', data: data },
    'log',
  );
};
// Utility: Extract Data
const extractData = ({ body }) => {
  const { login_data, basic_info, ...otherInfo } = body;
  return { login_data, basic_info, otherInfo };
};
const generateToken = (userData) => {
  return jwt.sign(userData, process.env.SECRET_KEY || 'YOUR_SECRET_KEY');
};
const createCollectionObject = (body, userId) => {
  return {
    userId: body.userId || userId, // Use userId from body if available, else use the passed userId
    name: body.name || '',
    description: body.description || '',
    totalPrice: body.totalPrice || 0,
    quantity: body.quantity || 0,
    totalQuantity: body.totalQuantity || 0,
    dailyPriceChange: body.dailyPriceChange || '',
    priceDifference: body.priceDifference || 0,
    priceChange: body.priceChange || 0,
    previousDayTotalPrice: body.previousDayTotalPrice || 0,
    latestPrice: {
      num: body.latestPrice?.num || 0,
      timestamp: body.latestPrice?.timestamp || new Date(),
    },
    lastSavedPrice: {
      num: body.lastSavedPrice?.num || 0,
      timestamp: body.lastSavedPrice?.timestamp || new Date(),
    },
    cards: Array.isArray(body.cards) ? body.cards : [],
    currentChartDataSets2: Array.isArray(body.currentChartDataSets2)
      ? body.currentChartDataSets2
      : [],
    collectionPriceHistory: Array.isArray(body.collectionPriceHistory)
      ? body.collectionPriceHistory
      : [],
    dailyCollectionPriceHistory: Array.isArray(body.dailyCollectionPriceHistory)
      ? body.dailyCollectionPriceHistory
      : [],
    chartData: {
      name: body.chartData?.name || `Chart for ${body.name || 'Collection'}`,
      userId: body.chartData?.userId || body.userId || userId,
      datasets: Array.isArray(body.chartData?.datasets) ? body.chartData.datasets : [],
      allXYValues: Array.isArray(body.chartData?.allXYValues) ? body.chartData.allXYValues : [],
      // xys: Array.isArray(body.chartData?.xys) ? body.chartData.xys : [],
    },
  };
};

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
  respondWithError,
  getCardInfo,
  convertPrice,
  filterUniqueCards,
  handleDuplicateYValuesInDatasets,
  validateObjectId,
  handleValidationErrors,
  logInfo,
  // logError,
  extractData,
  generateToken,
  validateVarType,
  createCollectionObject,
};
