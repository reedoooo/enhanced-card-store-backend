const User = require('../../../models/User');
const CustomError = require('../../../middleware/customError');
const { logError } = require('../../../utils/loggingUtils');
const { STATUS, MESSAGES } = require('../../../constants');
const { extractData } = require('../../../utils/utils');
const { setupDefaultCollectionsAndCards } = require('../helpers');
const jwt = require('jsonwebtoken');
const {
  validateSignupInput,
  checkForExistingUser,
  handleSignupError,
  findAndValidateUser,
  validateSigninInput,
  handleSigninError,
} = require('../../../middleware/validation/validators');
const { createUser, createUserValidationData } = require('./userHelpers');
const { populateUserDataByContext } = require('../dataUtils');
const {
  generateRefreshToken,
  updateRefreshToken,
  invalidateToken,
  isRefreshTokenValid,
  saveRefreshToken,
  generateToken,
  saveTokens,
} = require('../../../services/auth');
// !--------------------------! USERS !--------------------------!

// USER ROUTES: SIGNUP / SIGNIN
exports.signup = async (req, res, next) => {
  try {
    const { username, password, email, role_data, firstName, lastName } = extractData(req);
    validateSignupInput(username, password, email);
    await checkForExistingUser(username, email);

    const { newUser } = await createUser(username, password, email, role_data, firstName, lastName);
    const verifiedUser = await createUserValidationData(newUser);

    await setupDefaultCollectionsAndCards(verifiedUser, '', {});

    const populatedUser = await populateUserDataByContext(verifiedUser._id, [
      'decks',
      'collections',
      'cart',
    ]);

    res.status(201).json({
      message: 'User created successfully, default collections created, and default cards added',
      data: {
        user: populatedUser,
        accessToken: verifiedUser.userSecurityData.accessToken,
        refreshToken: verifiedUser.userSecurityData.refreshToken,
      },
    });
  } catch (error) {
    handleSignupError(error, res, next);
  }
};
exports.signin = async (req, res, next) => {
  try {
    const { username, password } = req.body.userSecurityData;
    validateSigninInput(username, password);

    const user = await findAndValidateUser(username, password);
    const populatedUser = await populateUserDataByContext(user._id, [
      'decks',
      'collections',
      'cart',
    ]);

    const accessToken = await generateToken(populatedUser._id); // Access token
    const refreshToken = await generateRefreshToken(populatedUser._id); // New refresh token
    await saveTokens(populatedUser._id, accessToken, refreshToken);

    // await updateRefreshToken(populatedUser._id, refreshToken);

    // await populatedUser.save();

    res.status(200).json({
      message: 'Sign in successful: Fetched user data successfully',
      data: { accessToken, refreshToken, user: populatedUser },
    });
  } catch (error) {
    handleSigninError(error, res, next);
  }
};
exports.signout = async (req, res, next) => {
  try {
    const { userId, refreshToken } = req.body;
    const user = await User.findById(userId).populate('userSecurityData');

    if (user && user.userSecurityData && user.userSecurityData.refreshToken) {
      invalidateToken(refreshToken);
      await updateRefreshToken(userId, null); // Set the refreshToken to null
    }

    res.status(200).json({ message: 'Logout successful', data: { userId } });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
    next(error);
  }
};
exports.checkToken = async (req, res, next) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1]; // Assuming the format is "Bearer <token>"

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // Add decoded user data to the request object
    return res.status(200).send({ message: 'Token is valid', data: decoded });
    // next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // If the token is not valid, catch the error and return an unauthorized status
    res.status(401).send({ message: 'Invalid token' });

    // If the token is not valid, catch the error and return an unauthorized status
    next(error);
  }
};
// USER DATA ROUTES (GET)
exports.getUserData = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const populatedUser = await populateUserDataByContext(userId, ['decks', 'collections', 'cart']);
    if (!populatedUser) {
      throw new CustomError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
    }

    res.status(200).json({
      message: 'Fetched user data successfully',
      data: populatedUser,
    });
  } catch (error) {
    console.error('Get User Data Error: ', error);
    logError('Get User Data Error: ', error, null, { error });
    next(error);
  }
};
exports.updateUserData = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const updatedUser = req.body;

    if (!userId || !updatedUser || typeof updatedUser !== 'object') {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Find the user by ID and ensure that user exists and populate necessary fields
    let user = await User.findById(userId); // Fetch user without populating
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic and security data as needed, while avoiding direct assignments to protected fields
    if (updatedUser.userBasicData) {
      await User.findByIdAndUpdate(userId, { $set: { userBasicData: updatedUser.userBasicData } });
      console.log('UPDATED USER BASIC DATA', updatedUser.userBasicData);
    }
    if (updatedUser.userSecurityData) {
      await User.findByIdAndUpdate(userId, {
        $set: { userSecurityData: updatedUser.userSecurityData },
      });
      console.log('UPDATED USER SECURITY DATA', updatedUser.userSecurityData);
    }

    // Fetch the updated user and populate necessary fields
    const updatedUserDoc = await populateUserDataByContext(userId, [
      'decks',
      'collections',
      'cart',
    ]);

    if (!updatedUserDoc) {
      console.error('User not found', updatedUserDoc);
      return res.status(404).json({ message: 'User not found', data: updatedUserDoc });
    }
    console.log('UPDATED USER DATA', updatedUserDoc);

    // Send response
    res.status(200).json({
      message: 'User data updated successfully',
      data: { user: updatedUserDoc },
    });
  } catch (error) {
    console.error('Update User Data Error: ', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
    next(error);
  }
};
// !--------------------------! USERS !--------------------------!
