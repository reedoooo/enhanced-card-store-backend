const jwt = require('jsonwebtoken');
const {
  checkForExistingUser,
  findAndValidateUser,
  validateUserCredentials,
} = require('../middleware/errorHandling/validators');
const { registerUser } = require('./utils/helpers2');
const { populateUserDataByContext } = require('./utils/dataUtils');
const {
  generateRefreshToken,
  invalidateToken,
  generateToken,
  saveTokens,
} = require('../middleware/auth');
const logger = require('../configs/winston');
const { User } = require('../models/User');
const { setupDefaultCollectionsAndCards } = require('./utils/helpers');
// !--------------------------! USERS !--------------------------!
exports.signup = async (req, res, next) => {
  try {
    const { username, password, email, firstName, lastName } = req.body.userSecurityData;
    logger.info(
      `ALL EXFTRACTED DATA: ${username}, ${password}, ${email}, ${firstName}, ${lastName}`,
    );
    validateUserCredentials(username, password, email);
    await checkForExistingUser(username, email);
    const newUser = await registerUser(username, password, email, firstName, lastName);
    logger.info(`User ${newUser.username} registered successfully`);
    const populatedUser = await populateUserDataByContext(newUser?._id, [
      'decks',
      'collections',
      'cart',
    ]);
    const accessToken = await generateToken(populatedUser._id, false);
    const refreshToken = await generateRefreshToken(populatedUser._id); // New refresh token
    await saveTokens(populatedUser._id, accessToken, refreshToken);
    await setupDefaultCollectionsAndCards(populatedUser, '', {});
    res.status(201).json({
      message: 'User created successfully, default collections created, and default cards added',
      data: {
        user: populatedUser,
        userId: populatedUser._id,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });
  } catch (error) {
    next(error); // Pass errors to error handling middleware
  }
};
exports.signin = async (req, res, next) => {
  try {
    const { username, password } = req.body.userSecurityData;
    validateUserCredentials(username, password);
    const user = await findAndValidateUser(username, password);
    const populatedUser = await populateUserDataByContext(user._id, [
      'decks',
      'collections',
      'cart',
    ]);
    const accessToken = await generateToken(populatedUser._id, false);
    const refreshToken = await generateRefreshToken(populatedUser._id); // New refresh token
    await saveTokens(populatedUser._id, accessToken, refreshToken);

    res.status(200).json({
      message: 'Sign in successful: Fetched user data successfully',
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: populatedUser,
        userId: populatedUser._id,
      },
    });
  } catch (error) {
    next(error); // Pass errors to error handling middleware
  }
};
exports.signout = async (req, res, next) => {
  const { userId, refreshToken } = req.body;
  const user = await User.findById(userId).populate('userSecurityData');
  if (user && user?.userSecurityData && user.userSecurityData?.refreshToken) {
    invalidateToken(refreshToken);
  }
  res.status(200).json({ message: 'Logout successful', data: { userId } });
};
exports.checkToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Access denied. No token provided.' }).catch(next);
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  req.user = decoded;
  return res.status(200).send({ message: 'Token is valid', data: decoded });
};
exports.getUserData = async (req, res, next) => {
  const userId = req.params.userId;
  const populatedUser = await populateUserDataByContext(userId, ['decks', 'collections', 'cart']);
  res.status(200).json({
    message: 'Fetched user data successfully',
    data: populatedUser,
  });
};
exports.updateUserData = async (req, res, next) => {
  const userId = req.params.userId;
  const { updatedUserData } = req.body;
  let user = await User.findById(userId);
  if (updatedUserData.userBasicData) {
    await User.findByIdAndUpdate(userId, {
      $set: { userBasicData: updatedUserData.userBasicData },
    });
    logger.info('UPDATED USER BASIC DATA', updatedUserData.userBasicData);
  }
  if (updatedUserData.userSecurityData) {
    await User.findByIdAndUpdate(userId, {
      $set: { userSecurityData: updatedUserData.userSecurityData },
    });
    logger.info('UPDATED USER SECURITY DATA', updatedUserData.userSecurityData);
  }
  await User.findByIdAndUpdate(userId, {
    $set: { updatedAt: new Date() },
  });
  const updatedUserDoc = await populateUserDataByContext(userId, ['decks', 'collections', 'cart']);
  logger.info('UPDATED USER DATA', updatedUserDoc);
  res.status(200).json({
    message: 'User data updated successfully',
    data: { user: updatedUserDoc },
  });
};
// !--------------------------! USERS !--------------------------!
