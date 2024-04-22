const { STATUS, MESSAGES } = require('../configs/constants');
const jwt = require('jsonwebtoken');
const {
  validateSignupInput,
  checkForExistingUser,
  findAndValidateUser,
  validateSigninInput,
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
// exports.signup = async (req, res, next) => {
//   const { username, password, email, role_data, firstName, lastName } = extractData(req);
//   validateSignupInput(username, password, email);
//   await checkForExistingUser(username, email);

//   const { newUser } = await createUser(username, password, email, role_data, firstName, lastName);
//   const verifiedUser = await createUserValidationData(newUser);
//   await setupDefaultCollectionsAndCards(verifiedUser, '', {});

//   const populatedUser = await populateUserDataByContext(verifiedUser._id, [
//     'decks',
//     'collections',
//     'cart',
//   ]);

//   res.status(201).json({
//     message: 'User created successfully, default collections created, and default cards added',
//     data: {
//       user: populatedUser,
//       userId: verifiedUser._id,
//       accessToken: verifiedUser.userSecurityData.accessToken,
//       refreshToken: verifiedUser.userSecurityData.refreshToken,
//     },
//   });
// };

exports.signup = async (req, res, next) => {
  try {
    const { username, password, email, firstName, lastName } = req.body.userSecurityData;
    logger.info(
      `ALL EXFTRACTED DATA: ${username}, ${password}, ${email}, ${firstName}, ${lastName}`,
    );
    // Validate input and check for existing user
    validateSignupInput(username, password, email);
    await checkForExistingUser(username, email);

    // Register user and get verified user details
    const newUser = await registerUser(username, password, email, firstName, lastName);
    // const user = await findAndValidateUser(newUser.username, newUser.password);
    logger.info(`User ${newUser.username} registered successfully`);
    logger.info(`User ${newUser} fetched successfully`);
    const populatedUser = await populateUserDataByContext(newUser?._id, [
      'decks',
      'collections',
      'cart',
    ]);
    // const populatedUser = await populateUserDataByContext(verifiedUser._id, [
    //   'decks',
    //   'collections',
    //   'cart',
    // ]);
    const accessToken = await generateToken(populatedUser._id, false);
    const refreshToken = await generateRefreshToken(populatedUser._id); // New refresh token
    await saveTokens(populatedUser._id, accessToken, refreshToken);
    await setupDefaultCollectionsAndCards(populatedUser, '', {});

    // Populate additional user data
    res.status(201).json({
      message: 'User created successfully, default collections created, and default cards added',
      data: {
        user: populatedUser,
        userId: populatedUser._id,
        accessToken: accessToken,
        refreshToken: refreshToken,
        // user: populatedUser,
        // userId: verifiedUser._id,
        // accessToken: verifiedUser.userSecurityData.accessToken,
        // refreshToken: verifiedUser.userSecurityData.refreshToken,
      },
    });
  } catch (error) {
    next(error); // Pass errors to error handling middleware
  }
};
exports.signin = async (req, res, next) => {
  const { username, password } = req.body.userSecurityData;
  validateSigninInput(username, password);
  const user = await findAndValidateUser(username, password);
  const populatedUser = await populateUserDataByContext(user._id, ['decks', 'collections', 'cart']);
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
};
exports.signout = async (req, res, next) => {
  const { userId, refreshToken } = req.body;
  const user = await User.findById(userId).populate('userSecurityData');

  if (user && user?.userSecurityData && user.userSecurityData?.refreshToken) {
    invalidateToken(refreshToken);
    // await generateToken(userId, null); // Set the refreshToken to null
  }

  res.status(200).json({ message: 'Logout successful', data: { userId } });
};
exports.checkToken = async (req, res, next) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Access denied. No token provided.' }).catch(next);
  }

  const token = authHeader.split(' ')[1]; // Assuming the format is "Bearer <token>"

  // Verify the token
  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  req.user = decoded; // Add decoded user data to the request object
  return res.status(200).send({ message: 'Token is valid', data: decoded });
  // next(); // Proceed to the next middleware or route handler
};
exports.getUserData = async (req, res, next) => {
  const userId = req.params.userId;
  const populatedUser = await populateUserDataByContext(userId, ['decks', 'collections', 'cart']);
  if (!populatedUser) {
    throw new Error(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
  }
  res.status(200).json({
    message: 'Fetched user data successfully',
    data: populatedUser,
  });
};
exports.updateUserData = async (req, res, next) => {
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

  // Fetch the updated user and populate necessary fields
  const updatedUserDoc = await populateUserDataByContext(userId, ['decks', 'collections', 'cart']);

  if (!updatedUserDoc) {
    logger.error('User not found', updatedUserDoc);
    return res.status(404).json({ message: 'User not found', data: updatedUserDoc });
  }
  logger.info('UPDATED USER DATA', updatedUserDoc);

  // Send response
  res.status(200).json({
    message: 'User data updated successfully',
    data: { user: updatedUserDoc },
  });
};
// !--------------------------! USERS !--------------------------!
