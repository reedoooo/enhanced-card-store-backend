const bcrypt = require('bcrypt');
const { sendJsonResponse } = require('../../utils/utils');
const logger = require('../../configs/winston');
const { User } = require('../../models/User');
const validatePresence = (data, fieldName) => {
  if (!data) throw new Error(`${fieldName} is required`);
};
const validateEntityPresence = (entity, errorMessage, errorCode, response) => {
  if (!entity) {
    sendJsonResponse(response, errorCode, errorMessage);
    throw new Error(errorMessage);
  }
};
const validateUserCredentials = (username, password, email = '') => {
  validatePresence(username, 'Username');
  validatePresence(password, 'Password');
  if (email) validatePresence(email, 'Email');
};
async function findAndValidateUser(username, password) {
  const user = await User.findOne({ username })
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
async function checkForExistingUser(username, email) {
  const existingUser = await User.findOne({
    $or: [{ 'userSecurityData.username': username }, { 'userBasicData.email': email }],
  });
  if (!existingUser) {
    logger.info('[SUCCESS]'.green + 'User does not exist');
    return;
  }
  if (existingUser) {
    const errorMsg =
      existingUser.username === username ? 'Username already exists' : 'Email already exists';
    throw new Error(errorMsg);
  }
}
module.exports = {
  validateUserCredentials,
  validateEntityPresence,
  checkForExistingUser,
  findAndValidateUser,
};
