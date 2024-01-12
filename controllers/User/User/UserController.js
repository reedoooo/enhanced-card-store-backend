const User = require('../../../models/User');
const CustomError = require('../../../middleware/customError');
const { logError } = require('../../../utils/loggingUtils');
const { STATUS, MESSAGES } = require('../../../constants');
const { generateToken, extractData } = require('../../../utils/utils');
const { setupDefaultCollectionsAndCards } = require('../helpers');
const {
  validateSignupInput,
  checkForExistingUser,
  handleSignupError,
  findAndValidateUser,
  validateSigninInput,
  handleSigninError,
} = require('../../../middleware/validation/validators');
const { createUser } = require('./userHelpers');
const { populateUserDataByContext } = require('../dataUtils');
// !--------------------------! USERS !--------------------------!

// USER ROUTES: SIGNUP / SIGNIN
exports.signup = async (req, res, next) => {
  try {
    const { username, password, email, role_data, firstName, lastName } = extractData(req);

    validateSignupInput(username, password, email);
    await checkForExistingUser(username, email);

    const { newUser, newUserSecurityData, newUserBasicData } = await createUser(
      username,
      password,
      email,
      role_data,
      firstName,
      lastName,
    );

    await setupDefaultCollectionsAndCards(newUser);

    // Populating user data for multiple contexts
    const populatedUser = await populateUserDataByContext(newUser._id, [
      'decks',
      'collections',
      'cart',
    ]);

    const token = generateToken(populatedUser);

    console.log('Signup Complete', populatedUser);

    res.status(201).json({
      message: 'User created successfully, default collections created, and default cards added',
      data: { user: populatedUser, token },
    });
  } catch (error) {
    handleSignupError(error, res, next);
  }
};
exports.signin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    validateSigninInput(username, password);

    const user = await findAndValidateUser(username, password);
    const populatedUser = await populateUserDataByContext(user._id, [
      'decks',
      'collections',
      'cart',
    ]);

    const token = generateToken(user); // Assuming generateToken is the same as used in signup

    res.status(200).json({
      message: 'Sign in successful: Fetched user data successfully',
      data: { token, user: populatedUser },
    });
  } catch (error) {
    handleSigninError(error, res, next);
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
