// utils.js
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');
const { GENERAL, MESSAGES, STATUS } = require('../constants');
const CustomError = require('../middleware/customError');
const User = require('../models/User');
const { default: axios } = require('axios');
const { validationResult } = require('express-validator');
const { Collection } = require('../models/Collection');
const { unifiedErrorHandler } = require('../middleware/unifiedErrorHandler');
const axiosInstance = axios.create({
  baseURL: 'https://db.ygoprodeck.com/api/v7/',
});
const calculatePriceDifference = (initialPrice, updatedPrice) => initialPrice - updatedPrice;
const calculateNewTotalPrice = (totalPrice, priceDifference) => totalPrice + priceDifference;
const splitDateTime = (date) => {
  return {
    date: date.toISOString().split('T')[0], // e.g., "2023-05-01"
    time: date.toTimeString().split(' ')[0], // e.g., "12:01:35"
  };
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
const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
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
const findUserById = async (userId) => {
  const users = await User.find();
  return users.find((user) => user._id.toString() === userId);
};
const findUser = async (username) => {
  return await User.findOne({ 'userSecurityData.username': username });
};
/**
 * Updates a document with a retry mechanism to handle VersionErrors.
 * @param {mongoose.Model} model - The model to be updated.
 * @param {object} update - The update object.
 * @param {object} options - The options object.
 * @param {number} retryCount - The number of times the update has been retried.
 * @returns {object} - The updated document.
 * */
async function updateDocumentWithRetry(model, update, options = {}, retryCount = 0) {
  try {
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
/**
 * Fetches card info from the YGOProDeck API.
 * @param {string} cardId - The ID of the card to fetch.
 * @returns {object} - The card info object.
 * */
const getCardInfo = async (cardId) => {
  try {
    const { data } = await axiosInstance.get(`/cardinfo.php?id=${encodeURIComponent(cardId)}`);
    return data.data[0];
  } catch (error) {
    console.error(`Error fetching card info for card ID ${cardId}:`, error);
    throw error;
  }
};

/**
 * Creates a new chart data entry with the current date and time.
 * @param {number} yValue - The y value to be added to the chart data entry.
 * @returns {object} - The new chart data entry.
 */
async function filterUniqueYValues(collectionId) {
  try {
    // Retrieve the collection
    let collection = await Collection.findById(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Get the allXYValues array from the collection's chartData
    const allXYValues = collection.chartData.allXYValues;

    // Create a new array to hold the filtered values
    const uniqueYValues = [];

    // Create a Set to track seen y values
    const seenYValues = new Set();

    // Filter out duplicate y values
    allXYValues.forEach((item) => {
      if (!seenYValues.has(item.y)) {
        seenYValues.add(item.y); // Mark the y value as seen
        uniqueYValues.push(item); // Add the item to the filtered list
      }
    });

    // Logging the filtered data
    console.log('Filtered and updated collection XY values with unique Y values', uniqueYValues[0]);
    // Return the filtered array with unique y values
    return uniqueYValues;
  } catch (error) {
    console.error('Failed to filter unique Y values:', error);
  }
}
/**
 * Filters the dailyCollectionPriceHistory to ensure that only the first data point
 * in each 24-hour period is kept.
 * @param {mongoose.Types.ObjectId} collectionId - The ID of the collection to filter.
 */
async function filterDailyCollectionPriceHistory(collectionId) {
  try {
    // Retrieve the collection
    let collection = await Collection.findById(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Ensure the data is sorted by timestamp
    collection.dailyCollectionPriceHistory.sort((a, b) => a.timestamp - b.timestamp);

    // Filter out entries that are less than 24 hours apart from the next timestamp
    const filteredHistory = collection.dailyCollectionPriceHistory.reduce(
      (acc, current, index, array) => {
        // Always keep the first element
        if (index === 0) {
          acc.push(current);
        } else {
          const previousTimestamp = array[index - 1].timestamp;
          const currentTimestamp = current.timestamp;
          const timeDiff = currentTimestamp - previousTimestamp;

          // If the difference is 24 hours or more, keep the current item
          if (timeDiff >= 86400000) {
            // 86,400,000 milliseconds in 24 hours
            acc.push(current);
          }
        }
        return acc;
      },
      [],
    );

    // Update the collection with the filtered history
    // collection.dailyCollectionPriceHistory = filteredHistory;
    // await collection.save();
    console.log('Filtered and updated collection price history', filteredHistory);
    return filteredHistory;
  } catch (error) {
    console.error('Failed to filter daily collection price history:', error);
  }
}
/**
 * handles validation errors from express-validator.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * */
const handleValidationErrors = (req, res, next) => {
  // Handle validation errors which means that the request failed validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new CustomError(MESSAGES.VALIDATION_ERROR, STATUS.BAD_REQUEST, true, {
      validationErrors: errors.array(),
    });
    return next(error); // Pass the error to the next error-handling middleware
  }
  // If no validation errors, continue to the next middleware
  if (next) {
    next();
  }
};
/**
 * Handles errors in async functions.
 * @param {function} fn - The async function to be wrapped.
 * @returns {function} - The wrapped function.
 * */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    unifiedErrorHandler(error, req, res, next);
  });
};
/**
 * Handles errors in async functions.
 * @param {function} fn - The async function to be wrapped.
 * @returns {function} - The wrapped function.
 */
const asyncErrorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    unifiedErrorHandler(error, req, res, next);
  });
};

/**
 * Extracts the data from the request body.
 * @param {object} req - The request object.
 * @returns {object} - The extracted data.
 * */
const extractData = ({ body }) => {
  const { userSecurityData, userBasicData } = body;
  const { username, password, email, role_data } = userSecurityData;
  const { firstName, lastName } = userBasicData || {};

  return {
    username,
    password,
    email,
    role_data,
    firstName,
    lastName,
  };
};
/**
 * Generates a JWT token for the user.
 * @param {object} userData - The user data to be used to generate the token.
 * @returns {string} - The generated token.
 * */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role_data: user.userSecurityData.role_data,
    },
    process.env.SECRET_KEY,
    { expiresIn: '1h' },
  ); // Replace '1h' with your desired token expiration
}

/**
 * Creates a new collection object.
 * @param {object} body - The request body.
 * @param {string} userId - The ID of the user creating the collection.
 * @returns {object} - The new collection object.
 * */
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
      // datasets: Array.isArray(body.chartData?.datasets) ? body.chartData.datasets : [],
      allXYValues: Array.isArray(body.chartData?.allXYValues) ? body.chartData.allXYValues : [],
      // xys: Array.isArray(body.chartData?.xys) ? body.chartData.xys : [],
    },
  };
};
/**
 * Formats a date object to the format "DD/MM/YYYY, HH:MM".
 * @param {Date} date - The date object to be formatted.
 * @returns {string} - The formatted date string.
 * */
const formatDateTime = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};
/**
 * Calculates the total value of the collection.
 * @param {object} cards - The collection object.
 * @returns {number} - The total value of the collection.
 * */
const calculateCollectionValue = (cards) => {
  if (!cards?.cards && !Array.isArray(cards) && !cards?.name && !cards?.restructuredCollection) {
    console.warn('Invalid or missing collection', cards);
    return 0;
  }

  if (cards?.tag === 'new') {
    return 0;
  }
  if (cards?.restructuredCollection) {
    return cards?.restructuredCollection?.cards.reduce((totalValue, card) => {
      const cardPrice = card?.price || 0;
      const cardQuantity = card?.quantity || 0;
      return totalValue + cardPrice * cardQuantity;
    }, 0);
  }
  if (cards?.cards && Array.isArray(cards?.cards)) {
    return cards?.cards.reduce((totalValue, card) => {
      const cardPrice = card?.price || 0;
      const cardQuantity = card?.quantity || 0;
      return totalValue + cardPrice * cardQuantity;
    }, 0);
  }

  return cards.reduce((totalValue, card) => {
    const cardPrice = card.price || 0;
    const cardQuantity = card.quantity || 0;
    return totalValue + cardPrice * cardQuantity;
  }, 0);
};

module.exports = {
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
  getCardInfo,
  convertPrice,
  filterUniqueCards,
  handleDuplicateYValuesInDatasets,
  validateObjectId,
  handleValidationErrors,
  extractData,
  generateToken,
  validateVarType,
  createCollectionObject,
  formatDateTime,
  calculateCollectionValue,
  filterDailyCollectionPriceHistory,
  filterUniqueYValues,
  asyncErrorHandler,
};
