const { STATUS, MESSAGES } = require('../configs/constants');
const { extractData } = require('../utils/utils');
const jwt = require('jsonwebtoken');
const {
  validateSignupInput,
  checkForExistingUser,
  handleSignupError,
  findAndValidateUser,
  validateSigninInput,
} = require('../middleware/errorHandling/validators');
const {
  createUser,
  createUserValidationData,
} = require('./User/User/userHelpers');
const { populateUserDataByContext } = require('./User/dataUtils');
const {
  generateRefreshToken,
  updateRefreshToken,
  invalidateToken,
  generateToken,
  saveTokens,
} = require('../middleware/auth');
const logger = require('../configs/winston');
const { handleError } = require('../middleware/errorHandling/errorHandler');
const { User } = require('../models');
const { setupDefaultCollectionsAndCards } = require('./User/helpers');
// !--------------------------! USERS !--------------------------!

// USER ROUTES: SIGNUP / SIGNIN
exports.signup = async (req, res, next) => {
  try {
    const { username, password, email, role_data, firstName, lastName } =
      extractData(req);
    validateSignupInput(username, password, email);
    await checkForExistingUser(username, email);

    const { newUser } = await createUser(
      username,
      password,
      email,
      role_data,
      firstName,
      lastName,
    );
    const verifiedUser = await createUserValidationData(newUser);
    await setupDefaultCollectionsAndCards(verifiedUser, '', {});

    const populatedUser = await populateUserDataByContext(verifiedUser._id, [
      'decks',
      'collections',
      'cart',
    ]);

    res.status(201).json({
      message:
        'User created successfully, default collections created, and default cards added',
      data: {
        user: populatedUser,
        userId: verifiedUser._id,

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
    const accessToken = await generateToken(populatedUser._id, false);
    const refreshToken = await generateRefreshToken(populatedUser._id); // New refresh token
    await saveTokens(populatedUser._id, accessToken, refreshToken);

    res.status(200).json({
      message: 'Sign in successful: Fetched user data successfully',
      data: {
        accessToken,
        refreshToken,
        user: populatedUser,
        userId: populatedUser._id,
      },
    });
  } catch (error) {
    handleError(error, 'Error signing in user');
  }
};
exports.signout = async (req, res, next) => {
  try {
    const { userId, refreshToken } = req.body;
    const user = await User.findById(userId).populate('userSecurityData');

    if (user && user?.userSecurityData && user.userSecurityData?.refreshToken) {
      invalidateToken(refreshToken);
      await updateRefreshToken(userId, null); // Set the refreshToken to null
    }

    res.status(200).json({ message: 'Logout successful', data: { userId } });
  } catch (error) {
    handleError(error, 'Error signing out user');
    next(error);
  }
};
exports.checkToken = async (req, res, next) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .send({ message: 'Access denied. No token provided.' });
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
exports.getUserData = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const populatedUser = await populateUserDataByContext(userId, [
      'decks',
      'collections',
      'cart',
    ]);
    if (!populatedUser) {
      throw new Error(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
    }
    res.status(200).json({
      message: 'Fetched user data successfully',
      data: populatedUser,
    });
  } catch (error) {
    logger.error('Get User Data Error: ', error);
    next(error);
  }
};
exports.updateUserData = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { updatedUserData } = req.body;

    if (!userId || !updatedUserData || typeof updatedUserData !== 'object') {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Find the user by ID and ensure that user exists and populate necessary fields
    let user = await User.findById(userId); // Fetch user without populating
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic and security data as needed, while avoiding direct assignments to protected fields
    if (updatedUserData.userBasicData) {
      await User.findByIdAndUpdate(userId, {
        $set: { userBasicData: updatedUserData.userBasicData },
      });
      console.log('UPDATED USER BASIC DATA', updatedUserData.userBasicData);
    }
    if (updatedUserData.userSecurityData) {
      await User.findByIdAndUpdate(userId, {
        $set: { userSecurityData: updatedUserData.userSecurityData },
      });
      console.log(
        'UPDATED USER SECURITY DATA',
        updatedUserData.userSecurityData,
      );
    }
    await User.findByIdAndUpdate(userId, {
      $set: { updatedAt: new Date() },
    });

    // Fetch the updated user and populate necessary fields
    const updatedUserDoc = await populateUserDataByContext(userId, [
      'decks',
      'collections',
      'cart',
    ]);

    if (!updatedUserDoc) {
      console.error('User not found', updatedUserDoc);
      return res
        .status(404)
        .json({ message: 'User not found', data: updatedUserDoc });
    }
    console.log('UPDATED USER DATA', updatedUserDoc);

    // Send response
    res.status(200).json({
      message: 'User data updated successfully',
      data: { user: updatedUserDoc },
    });
  } catch (error) {
    console.error('Update User Data Error: ', error);
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message });
    next(error);
  }
};
// !--------------------------! USERS !--------------------------!
