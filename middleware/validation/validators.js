const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User } = require('../../models');
// VALIDATES: createAndSaveCardInContext()
function validateCardData(cardData, cardModel) {
  if (!cardData) throw new Error('Card data is required');
  if (!mongoose.modelNames().includes(cardModel)) {
    throw new Error(`Invalid card model: ${cardModel}`);
  }
}
// VALIDATES: signup()
function validateSignupInput(username, password, email) {
  if (!username || !password || !email) {
    throw new Error('Missing required fields');
  }
}
async function checkForExistingUser(username, email) {
  const existingUser = await User.findOne({
    $or: [{ username }, { 'userSecurityData.email': email }],
  });

  if (existingUser) {
    throw new Error('Username or Email already exists');
  }
}
function handleSignupError(error, res, next) {
  console.error('Signup Error:', error);

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Duplicate key error', details: error.keyValue });
  }

  // For other errors, you might want to pass them to an error handling middleware
  next(error);
}
// VALIDATES: signin()
function validateSigninInput(username, password) {
  if (!username || !password) {
    throw new Error('Missing required fields');
  }
}
async function findAndValidateUser(username, password) {
  let user = await User.findOne({ username })
    .populate('userSecurityData')
    .populate('userBasicData');

  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, user.userSecurityData.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  return user;
}
function handleSigninError(error, res, next) {
  console.error('Signin Error:', error);
  // Log the error and send an appropriate response
  res
    .status(error.status || 500)
    .json({ message: error.message || 'An unexpected error occurred' });
}

module.exports = {
  validateCardData,
  validateSignupInput,
  checkForExistingUser,
  handleSignupError,
  validateSigninInput,
  findAndValidateUser,
  handleSigninError,
};
