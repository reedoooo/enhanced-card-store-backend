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
  try {
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

    if (!user && !isPasswordValid) {
      throw new Error('Invalid username or password');
    }
    return user;
  } catch (error) {
    logger.error(`Error finding user: ${error}`);
    throw error;
  }
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
const validate = (schema) => async (req, res, next) => {
  try {
    const parseBody = await schema.parseAsync(req.body);
    req.body = parseBody;
    next();
  } catch (err) {
    res.status(400).json({ msg: err.issues[0].message });
  }
};
module.exports = {
  validateUserCredentials,
  validateEntityPresence,
  checkForExistingUser,
  findAndValidateUser,
  validate,
};
