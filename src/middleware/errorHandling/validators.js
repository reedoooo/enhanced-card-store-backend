const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { sendJsonResponse } = require('../../utils/utils');
const logger = require('../../configs/winston');
const { User } = require('../../models/User');
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
/**
 * validateContextEntityExists that a deck exists.
 * @param {object} entity - The entity to be validated.
 * @param {string} errorMessage - The error message to be sent to the client.
 * @param {number} errorCode - The error code to be sent to the client.
 * @param {object} response - The response object to be sent to the client.
 * @returns {object} - The response object.
 * */
function validateContextEntityExists(entity, errorMessage, errorCode, response) {
  if (!entity) {
    sendJsonResponse(response, errorCode, errorMessage);
    throw new Error(errorMessage);
  }
}
function validateCardData(cardData, cardModel) {
  if (!cardData) throw new Error('Card data is required');
  if (!mongoose.modelNames().includes(cardModel)) {
    throw new Error(`Invalid card model: ${cardModel}`);
  }
}
function validateSignupInput(username, password, email) {
  if (!username || !password || !email) {
    throw new Error('Missing required fields');
  }
}
function validateSigninInput(username, password) {
  if (!username || !password) {
    throw new Error('Missing required fields');
  }
}
const isValidObjectId = (id) => {
  const ObjectIdRegEx = /^[0-9a-fA-F]{24}$/;
  return ObjectIdRegEx.test(id);
};
const validateInput = (userId, pricingData) => {
  try {
    if (!isValidObjectId(userId)) {
      throw new Error('UserId is missing, invalid, or not in the correct format.', 400);
    }
    if (!pricingData) {
      throw new Error('Pricing data is not provided.', 400);
    }

    ['updatedPrices', 'previousPrices'].forEach((priceType) => {
      if (typeof pricingData[priceType] !== 'object') {
        throw new Error(`Invalid ${priceType} provided.`, 400);
      }
    });
  } catch (error) {
    const errorResponse = new Error('Failed to validate user input. Please try again later.', 500);
    throw errorResponse; // Rethrow the error to be caught by the Express error middleware
    // return undefined;
  }
};
async function findAndValidateUser(username, password) {
  const user = await User.findOne({ username })
    .populate('userSecurityData')
    .populate('userBasicData');
  if (!user) {
    throw new Error('User not found');
  }
  // if (!user.userSecurityData || typeof user.userSecurityData.password !== 'string') {
  //   throw new Error('User security data is incomplete');
  // }

  // Now, safely comparing the password
  const isPasswordValid = await bcrypt.compare(password, user.userSecurityData.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  return user;
}
async function checkForExistingUser(username, email) {
  const existingUser = await User.findOne({
    $or: [{ username }, { 'userBasicData.email': email }],
  });
  if (!existingUser) {
    logger.info('[SUCCESS]'.green + 'User does not exist');
    return;
  }
  if (existingUser?.username === username) {
    throw new Error('Username already exists');
  }
  if (existingUser['userBasicData.email'] === email) {
    throw new Error('Email already exists');
  }
}
function handleSigninError(error, res, next) {
  logger.error('Signin Error:', error);
  // Log the error and send an appropriate response
  res
    .status(error.status || 500)
    .json({ message: error.message || 'An unexpected error occurred' });
}
function handleSignupError(error, res, next) {
  2;
  logger.error('Signup Error:', error);

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Duplicate key error', details: error.keyValue });
  }

  // For other errors, you might want to pass them to an error handling middleware
  next(error);
}
// function handleMongoError(err, req, res, next) {
//   if (err.name === 'MongoServerError' && err.code === 11000) {
//     const field = Object.keys(err.keyPattern)[0]; // 'login_data.username' or 'login_data.email'
//     const value = err.keyValue[field];
//     const message = `${field.split('.')[1]} '${value}' is already in use.`;
//     return res.status(409).json({ success: false, message });
//   }
//   next(err);
// }
function handleDuplicateKeyError(err, res) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already in use.`;
    logger.error(`Duplicate key error: ${message}`, err);
    res.status(409).json({ success: false, message });
    return true;
  }
  return false;
}

module.exports = {
  validateCardData,
  validateSignupInput,
  checkForExistingUser,
  handleSignupError,
  validateSigninInput,
  findAndValidateUser,
  handleSigninError,
  validateObjectId,
  validateVarType,
  ensureNumber,
  ensureString,
  ensureBoolean,
  ensureArray,
  ensureObject,
  validateContextEntityExists,
  validateObjectId,
  validateInput,
  isValidObjectId,
  // handleMongoError,
};
