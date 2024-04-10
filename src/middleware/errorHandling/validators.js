const mongoose = require("mongoose");
const User = require("../../models/User");
const bcrypt = require("bcrypt");
const { sendJsonResponse } = require("../../utils/utils");
const ensureNumber = (value) => Number(value);
const ensureString = (value) => String(value);
const ensureBoolean = (value) => Boolean(value);
const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureObject = (value) => (typeof value === "object" ? value : {});
const validateVarType = (value, type) => {
  switch (type) {
    case "number":
      return ensureNumber(value);
    case "string":
      return ensureString(value);
    case "boolean":
      return ensureBoolean(value);
    case "array":
      return ensureArray(value);
    case "object":
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
function validateContextEntityExists(
  entity,
  errorMessage,
  errorCode,
  response
) {
  if (!entity) {
    sendJsonResponse(response, errorCode, errorMessage);
    throw new Error(errorMessage);
  }
}
function validateCardData(cardData, cardModel) {
  if (!cardData) throw new Error("Card data is required");
  if (!mongoose.modelNames().includes(cardModel)) {
    throw new Error(`Invalid card model: ${cardModel}`);
  }
}
function validateSignupInput(username, password, email) {
  if (!username || !password || !email) {
    throw new Error("Missing required fields");
  }
}
async function checkForExistingUser(username, email) {
  const existingUser = await User.findOne({
    $or: [{ username }, { "userSecurityData.email": email }],
  });

  if (existingUser) {
    throw new Error("Username or Email already exists");
  }
}
function handleSignupError(error, res, next) {
  2;
  console.error("Signup Error:", error);

  if (error.code === 11000) {
    return res
      .status(409)
      .json({ message: "Duplicate key error", details: error.keyValue });
  }

  // For other errors, you might want to pass them to an error handling middleware
  next(error);
}
function validateSigninInput(username, password) {
  if (!username || !password) {
    throw new Error("Missing required fields");
  }
}
async function findAndValidateUser(username, password) {
  // Using findOne to ensure we're getting a single user document
  const user = await User.findOne({ username })
    .populate("userSecurityData")
    .populate("userBasicData");

  // Check if the user document was found
  if (!user) {
    throw new Error("User not found");
  }

  // Ensuring userSecurityData and the password field exist
  if (
    !user.userSecurityData ||
    typeof user.userSecurityData.password !== "string"
  ) {
    throw new Error("User security data is incomplete");
  }

  // Now, safely comparing the password
  const isPasswordValid = await bcrypt.compare(
    password,
    user.userSecurityData.password
  );
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  return user;
}
function handleSigninError(error, res, next) {
  console.error("Signin Error:", error);
  // Log the error and send an appropriate response
  res
    .status(error.status || 500)
    .json({ message: error.message || "An unexpected error occurred" });
}
const isValidObjectId = (id) => {
  const ObjectIdRegEx = /^[0-9a-fA-F]{24}$/;
  return ObjectIdRegEx.test(id);
};

const validateInput = (userId, pricingData) => {
  try {
    if (!isValidObjectId(userId)) {
      throw new Error(
        "UserId is missing, invalid, or not in the correct format.",
        400
      );
    }
    if (!pricingData) {
      throw new Error("Pricing data is not provided.", 400);
    }

    ["updatedPrices", "previousPrices"].forEach((priceType) => {
      if (typeof pricingData[priceType] !== "object") {
        throw new Error(`Invalid ${priceType} provided.`, 400);
      }
    });
  } catch (error) {
    const errorResponse = new Error(
      "Failed to validate user input. Please try again later.",
      500
    );
    throw errorResponse; // Rethrow the error to be caught by the Express error middleware
    // return undefined;
  }
};

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
};
