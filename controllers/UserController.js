const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const { validatePassword, createToken } = require('../services/auth');
// const mongoose = require('mongoose');
const Deck = require('../models/Deck');
const Collection = require('../models/Collection');
const winston = require('winston');
// const cardController = require('./CardController');
const {
  handleValidationErrors,
  handleUpdateAndSync,
  handleNotFound,
  ensureCollectionExists,
  validObjectId,
  convertPrice,
  filterUniqueCards,
  handleDuplicateYValuesInDatasets,
} = require('./userControllerUtilities');
const { directError, directResponse } = require('./userControllerResponses');
const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES, ERROR_SOURCES } = require('../constants');
const { handleError } = require('../middleware/handleErrors');
const { logToAllSpecializedLoggers, respondToClient } = require('../middleware/infoLogger');
const SECRET_KEY = process.env.SECRET_KEY;

// Utility: Extract Data
const extractData = ({ body }) => {
  const { login_data, basic_info, ...otherInfo } = body;
  return { login_data, basic_info, otherInfo };
};
const generateToken = (userData) => {
  return jwt.sign(userData, process.env.SECRET_KEY || 'YOUR_SECRET_KEY');
};
// Signup function
exports.signup = async (req, res, next) => {
  try {
    handleValidationErrors(req, res);

    const { login_data, basic_info, otherInfo } = extractData(req);
    const { username, password, email, role_data } = login_data || {};
    const { name } = basic_info || {};

    // Check for missing required fields
    if (!name || !email || !username || !password) {
      logToAllSpecializedLoggers('Required fields are missing for signup.', { section: 'signup' });
      return directError(
        res,
        'SIGNUP',
        new CustomError(MESSAGES.REQUIRED_FIELDS_MISSING, STATUS.BAD_REQUEST),
      );
    }

    const existingUser = await User.findOne({ 'login_data.username': username.trim() });
    if (existingUser) {
      logToAllSpecializedLoggers(`User already exists: ${username}`, { section: 'signup' });
      return directError(
        res,
        'SIGNUP',
        new CustomError(`${MESSAGES.USER_ALREADY_EXISTS} ${username}`, STATUS.CONFLICT),
      );
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const newUser = new User({
      login_data: {
        username: username.trim(),
        password: hashedPassword,
        email: email.trim(),
        role_data,
      },
      basic_info,
      ...otherInfo,
    });

    await newUser.save();

    const token = generateToken({
      username: newUser.login_data.username,
      id: newUser._id,
      capabilities: newUser.login_data.role_data.capabilities,
    });

    logToAllSpecializedLoggers('New user signup successful', { section: 'signup', user: username });

    return directResponse(res, 'SIGNUP', {
      status: STATUS.SUCCESS,
      message: MESSAGES.SIGNUP_SUCCESS,
      data: { token },
    });
  } catch (error) {
    logToAllSpecializedLoggers('Error during signup', {
      section: 'signup',
      error: error.toString(),
    });
    next(error);
  }
};

// Signin function
exports.signin = async (req, res, next) => {
  try {
    handleValidationErrors(req, res);

    const { username, password } = req.body;

    if (!process.env.SECRET_KEY) {
      logToAllSpecializedLoggers('Secret key is not set for signin.', { section: 'signin' });
      throw new CustomError(
        `${MESSAGES.SIGNIN_ERROR} ${process.env.SECRET_KEY}`,
        STATUS.INTERNAL_SERVER_ERROR,
        true,
        { source: ERROR_SOURCES.SIGNIN, detail: 'Secret key is not set!' },
      );
    }

    const user = await User.findOne({ 'login_data.username': username.trim() });
    if (!user) {
      logToAllSpecializedLoggers(`Invalid username for signin: ${username}`, { section: 'signin' });
      throw new CustomError(`${MESSAGES.INVALID_USERNAME} ${username}`, STATUS.NOT_FOUND, true, {
        source: ERROR_SOURCES.SIGNIN,
        detail: `User ${username} not found`,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user?.login_data?.password);
    if (!isPasswordValid) {
      logToAllSpecializedLoggers('Invalid password for signin.', {
        section: 'signin',
        username: username,
      });
      throw new CustomError(MESSAGES.INVALID_PASSWORD, STATUS.UNAUTHORIZED, true, {
        source: ERROR_SOURCES.SIGNIN,
        detail: 'Invalid Password',
      });
    }

    const token = generateToken({
      username: user.login_data.username,
      id: user._id,
      capabilities: user.login_data.role_data.capabilities,
    });

    logToAllSpecializedLoggers('User signin successful', { section: 'signin', user: username });

    return directResponse(res, 'SIGNIN', {
      status: STATUS.SUCCESS,
      message: MESSAGES.SIGNIN_SUCCESS,
      data: { token },
    });
  } catch (error) {
    logToAllSpecializedLoggers('Error during signin', {
      section: 'signin',
      error: error.toString(),
    });
    if (!res.headersSent) {
      next(error);
    }
  }
};
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.authData.id);
    if (!user) {
      return directError(
        res,
        'GET_PROFILE',
        new CustomError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND),
      );
    }

    directResponse(res, 'GET_PROFILE', {
      status: STATUS.SUCCESS,
      message: MESSAGES.GET_PROFILE_SUCCESS,
      data: user,
    });
  } catch (error) {
    winston.error('Get Profile Error: ', error);
    return directError(
      res,
      'GET_PROFILE',
      error instanceof CustomError
        ? error
        : new CustomError(MESSAGES.GET_PROFILE_ERROR, STATUS.INTERNAL_SERVER_ERROR, true, {
            source: ERROR_SOURCES.GET_PROFILE,
            detail: error.message || '',
            stack: error.stack,
          }),
    );
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.authData.id, updates, { new: true });
    if (!user) {
      return directError(res, MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
    }

    directResponse(res, STATUS.SUCCESS, MESSAGES.UPDATE_PROFILE_SUCCESS, user);
  } catch (error) {
    winston.error('Update Profile Error: ', error);
    directError(res, MESSAGES.UPDATE_PROFILE_ERROR, STATUS.INTERNAL_SERVER_ERROR, next, error);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.authData.id);

    if (!user) {
      return directError(
        res,
        'USER_NOT_FOUND',
        new Error(MESSAGES.USER_NOT_FOUND),
        STATUS.NOT_FOUND,
      );
    }

    directResponse(res, STATUS.SUCCESS, MESSAGES.DELETE_PROFILE_SUCCESS);
  } catch (error) {
    directError(res, 'DELETE_PROFILE_ERROR', error);
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      directError(res, 'USER_NOT_FOUND', new Error('User not found'));
      return;
    }
    directResponse(res, { data: user });
  } catch (error) {
    winston.error('Get by ID error: ', error);
    directError(res, 'GET_USER_ERROR', error);
  }
};

// Refactored code for deck operations using directResponse and directError

exports.getAllDecksForUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    user.allDecks = user.allDecks || [];
    const decks = (await Deck.find({ _id: { $in: user.allDecks } })) || [];

    if (decks.length === 0) {
      const newDeck = new Deck({
        userId: user._id,
        name: 'Default Deck',
        description: 'This is your default deck.',
        cards: [],
      });

      await newDeck.save();
      user.allDecks.push(newDeck._id);
      await user.save();
      decks.push(newDeck);
    }

    // Use directResponse for consistent logging and client response
    directResponse(res, 'FETCH_ALL_DECKS', 'info', 'Fetched all decks successfully', {
      data: decks,
    });
  } catch (error) {
    // Use directError for consistent error logging and client response
    directError(res, 'FETCH_ALL_DECKS_ERROR', 'error', error);
  }
};

exports.updateAndSyncDeck = async (req, res, next) => {
  try {
    const { userId, deckId } = req.params;
    const { cards, description, name, totalPrice } = req.body;

    const updatedDeck = await Deck.findOneAndUpdate(
      { _id: deckId, userId },
      { $set: { cards, name, description, totalPrice } },
      { new: true },
    );

    if (!updatedDeck) {
      throw new CustomError('Deck not found', 404);
    }

    // Use directResponse for logging success and responding to the client
    directResponse(res, 'UPDATE_DECK', 'info', 'Deck updated successfully', { data: updatedDeck });
  } catch (error) {
    // Use directError to handle errors consistently
    directError(res, 'UPDATE_DECK_ERROR', 'error', error);
  }
};

exports.createNewDeck = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, description, cards, totalPrice } = req.body;

    const newDeck = new Deck({ userId, name, description, cards, totalPrice });
    await newDeck.save();

    // Use directResponse for success actions
    directResponse(res, 'CREATE_NEW_DECK', 'info', 'New deck created successfully', {
      data: newDeck,
    });
  } catch (error) {
    // Use directError for error handling
    directError(res, 'CREATE_NEW_DECK_ERROR', 'error', error);
  }
};

const createCollectionObject = (body, userId) => {
  return {
    userId,
    name: body.name,
    description: body.description,
    totalCost: body.totalCost || '',
    totalPrice: body.totalPrice || 0,
    quantity: body.quantity || 0,
    totalQuantity: body.totalQuantity || 0,
    dailyPriceChange: body.dailyPriceChange || 0,
    priceDifference: body.priceDifference || 0,
    priceChange: body.priceChange || 0,
    previousDayTotalPrice: body.previousDayTotalPrice || 0,
    allCardPrices: body.allCardPrices || [],
    cards: body.cards || [],
    currentChartDatasets: body.currentChartDatasets || [],
    xys: Array.isArray(body.xys) ? body.xys : [],
    chartData: {
      name: body.chartData?.name || '',
      userId: body.chartData?.userId || userId,
      datasets: body.chartData?.datasets || [],
      xys: Array.isArray(body.xys) ? body.xys : [],
      allXYValues: body.chartData?.allXYValues || [],
    },
  };
};

exports.createNewCollection = async (req, res, next) => {
  const { userId: rawUserId } = req.params;

  const userId = validObjectId(rawUserId) ? rawUserId : null;
  if (!userId) {
    return directError(res, 'INVALID_USER_ID', 'error', new CustomError('Invalid user ID', 400));
  }

  try {
    await ensureCollectionExists(userId);
    const newCollectionData = createCollectionObject(req.body, userId);
    const newCollection = new Collection(newCollectionData);
    const savedCollection = await newCollection.save();

    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    user.allCollections.push(savedCollection._id);
    await user.save();

    directResponse(res, 'CREATE_NEW_COLLECTION', 'info', 'New collection created successfully', {
      newCollection: savedCollection,
    });
  } catch (error) {
    directError(res, 'CREATE_COLLECTION_ERROR', 'error', error);
  }
};

exports.getAllCollectionsForUser = async (req, res) => {
  try {
    const userId = validObjectId(req.params.userId) ? req.params.userId : null;

    if (!userId) {
      return directError(res, 'INVALID_USER_ID', 'error', new CustomError('Invalid user ID', 400));
    }

    const user = await User.findById(userId).populate('allCollections');
    if (!user) {
      return directError(res, 'USER_NOT_FOUND', 'error', new CustomError('User not found', 404));
    }

    directResponse(
      res,
      'FETCHED_USER_COLLECTIONS',
      'info',
      `Fetched ${user.allCollections.length} collections for user ${userId}`,
      { allCollections: user.allCollections },
    );
  } catch (error) {
    directError(res, 'FETCH_COLLECTIONS_ERROR', 'error', error);
  }
};

// Endpoint handler function that uses the above utility.
exports.updateAndSyncCollection = async (req, res) => {
  try {
    const { userId, collectionId } = req.params;

    // Validate Object IDs before proceeding
    if (!validObjectId(userId) || !validObjectId(collectionId)) {
      throw new CustomError('Invalid user or collection ID', STATUS.BAD_REQUEST);
    }

    const updateResult = await handleUpdateAndSync({ userId, collectionId }, req.body);

    // Check for errors in the updateResult
    if (updateResult.errors) {
      throw new CustomError('Errors occurred during update and sync', STATUS.INTERNAL_SERVER_ERROR);
    }

    // Respond with the success message and the updated collection
    directResponse(
      res,
      `Collection ${collectionId} for user ${userId} updated successfully`,
      'info',
      { data: updateResult.updatedCollection },
    );
  } catch (error) {
    // Handle errors consistently
    directError(res, error.message, 'error', error);
  }
};
// Ensure the ensureCollectionExists and handleUpdateAndSync functions are implemented elsewhere in the code.

// exports.getAllCollectionsForUser = async (req, res, next) => {
//   try {
//     const userId = validObjectId(req.params.userId) ? req.params.userId : null;

//     if (!userId) {
//       throw new CustomError('Invalid user ID', 400);
//     }

//     // Using the specialized logger for 'collection' section
//     logToAllSpecializedLoggers('info', `Fetching collections for user ${userId}`, {
//       section: 'collection',
//     });
//     const user = await User.findById(userId).populate('allCollections');

//     if (!user) {
//       throw new CustomError('User not found', 404);
//     }

//     // Again logging with the 'collection' section
//     logToAllSpecializedLoggers(
//       'info',
//       `Fetched ${user.allCollections.length} collections for user ${userId}`,
//       {
//         section: 'collection',
//       },
//     );

//     res.status(200).json({
//       message: `Fetched ${user.allCollections.length} collections for user ${userId}`,
//       data: { allCollections: user.allCollections },
//     });
//   } catch (error) {
//     // Logging the error with the 'error' section
//     logToAllSpecializedLoggers('error', 'Error in getAllCollectionsForUser', {
//       section: 'error',
//       error: error.message,
//     });
//     directError(res, 'FETCH_COLLECTIONS_ERROR', error, next);
//   }
// };

// exports.updateAndSyncCollection = async (req, res, next) => {
//   try {
//     const { userId, collectionId } = req.params;

//     if (!validObjectId(userId) || !validObjectId(collectionId)) {
//       throw new CustomError('Invalid user or collection ID', 400);
//     }

//     logToAllSpecializedLoggers(
//       'info',
//       `Attempting to update collection ${collectionId} for user ${userId}`,
//       {
//         section: 'collection',
//       },
//     );

//     const updateResult = await handleUpdateAndSync({ userId, collectionId }, req.body);

//     if (!updateResult || !updateResult.data || !updateResult.data.updatedCollection) {
//       throw new CustomError('Update operation did not return the expected result', 500);
//     }

//     const { status, data } = updateResult;

//     logToAllSpecializedLoggers(
//       'info',
//       `Collection ${collectionId} for user ${userId} updated successfully`,
//       {
//         section: 'collection',
//         data: data.updatedCollection,
//       },
//     );

//     res.status(status || 200).json({
//       message: `Updated collection with id: ${collectionId} for user ${userId}`,
//       data: { updatedCollection: data.updatedCollection },
//     });
//   } catch (error) {
//     logToAllSpecializedLoggers('error', 'Error in updateAndSyncCollection', {
//       section: 'error',
//       error: error.message,
//     });
//     directError(res, 'UPDATE_AND_SYNC_COLLECTION_ERROR', error, next);
//   }
// };

// exports.getAllCollectionsForUser = async (req, res, next) => {
//   // let isResponseSent = false; // Reset this flag for each new request

//   // const sendResponse = (eventType, options) => {
//   //   if (isResponseSent) {
//   //     console.warn('Attempted to send multiple responses');
//   //     return;
//   //   }
//   //   directResponse(res, eventType, options);
//   //   isResponseSent = true;
//   // };

//   // const sendError = (eventType, error) => {
//   //   if (isResponseSent) {
//   //     console.warn('Attempted to send multiple responses');
//   //     return;
//   //   }
//   //   directError(res, eventType, error, next);
//   //   isResponseSent = true;
//   // };

//   try {
//     const userId = validObjectId(req.params.userId) ? req.params.userId : null;

//     // Logging before query execution
//     logToAllSpecializedLoggers(`Fetching collections for user ${userId}`);

//     // Validate User ID
//     if (!userId) {
//       throw new CustomError('Invalid user ID', 400);
//     }

//     // Fetch User and Collections
//     const user = await User.findById(userId).populate('allCollections');

//     // Logging after query execution
//     logToAllSpecializedLoggers(
//       `Fetched ${user ? user.allCollections.length : 0} collections for user ${userId}`,
//     );

//     // Validate User Existence
//     if (!user) {
//       throw new CustomError('User not found', 404);
//     }

//     logToAllSpecializedLoggers(
//       `Fetched ${user.allCollections.length} collections for user ${userId}`,
//     );
//     // return directResponse(res, 'GET_ALL_COLLECTIONS_FOR_USER', {
//     //   status: STATUS.SUCCESS,
//     //   message: `Fetched ${user.allCollections.length} collections for user ${userId}`,
//     //   data: { allCollections: user.allCollections },
//     // });
//     res.status(200).json({
//       message: `Fetched ${user.allCollections.length} collections for user ${userId}`,
//       data: { allCollections: user.allCollections },
//     });
//   } catch (error) {
//     // Logging error details
//     logToAllSpecializedLoggers('[ERROR] in getAllCollectionsForUser:', error);
//     directError(res, 'FETCH_COLLECTIONS_ERROR', error, next);
//   }
// };

// exports.updateAndSyncCollection = async (req, res, next) => {
//   try {
//     const { userId, collectionId } = req.params;

//     // Validate object IDs
//     if (!validObjectId(userId) || !validObjectId(collectionId)) {
//       throw new CustomError('Invalid user or collection ID', 400);
//     }

//     if (!collectionId) return res.status(400).json({ message: 'collectionId is required' });

//     // Handle update and sync
//     const { status, data } = await handleUpdateAndSync({ userId, collectionId }, req.body);

//     // Send a successful response
//     res.status(status || STATUS.SUCCESS).json({
//       message: `Updated collection with id: ${collectionId} for user ${userId}`,
//       data: { data: data.updatedCollection },
//     });
//   } catch (error) {
//     logToAllSpecializedLoggers('[ERROR] in updateAndSyncCollection:', error);
//     // directError(res, 'UPDATE_AND_SYNC_COLLECTION', error, next);
//     // return directError(
//     //   res,
//     //   'UPDATE_AND_SYNC_COLLECTION',
//     //   error instanceof CustomError
//     //     ? error
//     //     : new CustomError(
//     //         MESSAGES.UPDATE_AND_SYNC_COLLECTION_ERROR,
//     //         STATUS.INTERNAL_SERVER_ERROR,
//     //         true,
//     //         {
//     //           source: ERROR_SOURCES.UPDATE_AND_SYNC_COLLECTION,
//     //           detail: error.message || '',
//     //           stack: error.stack,
//     //         },
//     //       ),
//     // );
//   }
// };

exports.deleteCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;

  try {
    // Find user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the collection within the user's collections and remove it
    const collectionIndex = user.allCollections?.findIndex(
      (c) => c._id.toString() === collectionId,
    );
    if (collectionIndex === -1) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Remove the collection and save the user
    user.allCollections?.splice(collectionIndex, 1);
    await user.save();

    res
      .status(200)
      .json({ message: 'Collection deleted successfully', deletedCollectionId: collectionId });
  } catch (error) {
    console.error(`Failed to delete the collection: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};
// Helper Functions
// const handleUpdateAndSync = async (userId, collectionId, body) => {
//   logBodyDetails(body);

//   const user = await User.findById(userId);
//   if (!user) throw new Error('User not found');

//   const existingCollection = await Collection.findOne({ _id: collectionId, userId }).populate(
//     'chartData',
//   );

//   if (!existingCollection) throw new Error('Collection not found');

//   const updatedCollection = await processIncomingData(existingCollection, body);
//   await updatedCollection.save();

//   return {
//     success: true,
//     data: { message: 'Collection and ChartData successfully updated', updatedCollection },
//   };
// };

// const logBodyDetails = (body) => {
//   const fieldsToLog = [
//     'chartData',
//     'allCardPrices',
//     'userId',
//     '_id',
//     'name',
//     'description',
//     'totalCost',
//     'totalPrice',
//     'quantity',
//     'totalQuantity',

//     'currentChartDatasets',
//     // 'cards',  // Removed 'cards' from here as we are logging it separately
//     'xys',
//     // '__v',
//     'dailyPriceChange',
//   ];
//   fieldsToLog.forEach((field) => console.log(`[7][USER CONTROLLER] ${field}:`, body[field]));

//   if (Array.isArray(body.cards) && body.cards.length > 0) {
//     // Log only the first card
//     const firstCard = body.cards[0];
//     console.log('[7][USER CONTROLLER] First Card:', firstCard);
//   }
// };

// const processIncomingData = async (existingCollection, body) => {
//   const { cards, chartData, ...rest } = body;
//   if (chartData?.datasets) {
//     handleIncomingDatasets(existingCollection, chartData.datasets);
//   }
//   if (chartData?.xys) {
//     handleIncomingXY(existingCollection, chartData.xys);
//   }
//   existingCollection.cards = filterUniqueCards(cards).map((card) => ({
//     ...card,
//     chart_datasets: handleDuplicateYValuesInDatasets(card), // Adjust to match the schema
//   }));

//   Object.assign(existingCollection, rest, {
//     totalPrice: determineTotalPrice(rest.totalPrice, rest.totalCost, existingCollection.totalPrice),
//   });

//   return existingCollection;
// };

// const handleIncomingDatasets = (existingCollection, incomingDatasets) => {
//   if (!existingCollection || !incomingDatasets) return;

//   incomingDatasets.forEach((incomingDataset) => {
//     const existingDataset = existingCollection.chartData.datasets.find(
//       (dataset) => dataset.name === incomingDataset.name,
//     );

//     if (existingDataset) {
//       // Merge existing data with incoming data
//       existingDataset.data = [...existingDataset.data, ...incomingDataset.data];
//       // Additional logic to merge or handle priceChangeDetails if necessary
//     } else {
//       // If the dataset does not exist, add it to the collection
//       existingCollection.chartData.datasets.push(incomingDataset);
//     }
//   });
// };

// const handleIncomingXY = (existingCollection, incomingXYs) => {
//   console.log('[8][INCOMING XY] --> incomingXYs', incomingXYs);
//   for (let incomingXY of incomingXYs) {
//     const existingXY = existingCollection.chartData.xys.find(
//       (xydata) => xydata.label === incomingXY.label,
//     );

//     if (existingXY) {
//       console.log('[8][EXISTING XY] --> existingXY', existingXY);
//       if (!Array.isArray(existingXY.data)) {
//         existingXY.data = []; // Initialize as an array if it's not already
//       }
//       console.log(existingXY.data); // Add this line to debug

//       existingXY.data.push({ x: incomingXY.x, y: incomingXY.y });
//     } else {
//       // If the label does not exist, add a new object to the collection
//       existingCollection.chartData.xys.push({
//         label: incomingXY.label,
//         data: [{ x: incomingXY.x, y: incomingXY.y }],
//       });
//     }

//     // Assuming that the filterData and roundToTenth functions are defined elsewhere
//     existingCollection.chartData.allXYValues = filterData([
//       ...existingCollection.chartData.allXYValues,
//       { label: incomingXY.label, x: incomingXY.x, y: roundToTenth(incomingXY.y) },
//     ]);
//   }
// };

// Filtering function to apply the required criteria
// const filterData = (data) => {
//   const xValues = new Set();
//   const yValues = new Set();
//   return data.filter((item) => {
//     if (xValues.has(item.x) || yValues.has(roundToTenth(item.y)) || item.y === 0) {
//       return false;
//     }
//     xValues.add(item.x);
//     yValues.add(roundToTenth(item.y));
//     return true;
//   });
// };

// const determineTotalPrice = (totalPrice, totalCost, existingPrice) => {
//   console.log('[8][DETERMINING UPDATED PRICE TO RETURN] --> totalPrice', totalPrice);
//   console.log('[8][DETERMINING UPDATED PRICE TO RETURN] --> totalCost', totalCost);
//   console.log('[8][DETERMINING UPDATED PRICE TO RETURN] --> existingPrice', existingPrice);

//   if (totalPrice === 0 && totalCost) {
//     return parseFloat(totalCost);
//   } else {
//     return totalPrice || existingPrice;
//   }
// };

// // Rounding function to round a number to the nearest 10th
// const roundToTenth = (num) => {
//   return Math.round(num * 10) / 10;
// };
// function validObjectId(id) {
//   return mongoose.Types.ObjectId.isValid(id);
// }

// validObjectId function remains the same as it is already quite clean and abstracted.

// exports.handleUpdateAndSync = handleUpdateAndSync;
// exports.updateAndSyncCollection = async (req, res, next) => {
//   const { userId: rawUserId, collectionId: rawCollectionId } = req.params;
//   const userId = validObjectId(rawUserId) ? rawUserId : new mongoose.Types.ObjectId();
//   const collectionId = validObjectId(rawCollectionId)
//     ? rawCollectionId
//     : new mongoose.Types.ObjectId();

//   try {
//     const user = await findUserById(userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const existingCollection = await findCollectionByIdAndUserId(collectionId, userId);
//     if (!existingCollection) return res.status(404).json({ message: 'Collection not found' });

//     const updatedCollection = await processIncomingData(existingCollection, req.body);

//     await updatedCollection.save();

//     return res.status(200).json({
//       data: {
//         message: 'Collection and ChartData successfully updated',
//         updatedCollection,
//       },
//     });
//   } catch (error) {
//     console.error('Failed to update collection:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// };
// exports.updateAndSyncCollection = async (req, res, next) => {
//   let { userId, collectionId } = req.params;
//   const {
//     description,
//     name,
//     chartData,
//     totalCost,
//     quantity,
//     totalPrice,
//     cards,
//     totalQuantity,
//     xy,
//   } = req.body;

//   userId = validObjectId(userId) ? userId : new mongoose.Types.ObjectId();
//   collectionId = validObjectId(collectionId) ? collectionId : new mongoose.Types.ObjectId();

//   try {
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const existingCollection = await Collection.findOne({ _id: collectionId, userId }).populate(
//       'chartData',
//     );
//     if (!existingCollection) return res.status(404).json({ message: 'Collection not found' });

//     const incomingDatasets = chartData?.datasets;

//     if (incomingDatasets) {
//       for (let incomingDataset of incomingDatasets) {
//         // Check if the dataset with the same name already exists in the collection
//         let existingDataset = existingCollection.chartData.datasets.find(
//           (ds) => ds.name === incomingDataset.name,
//         );

//         if (existingDataset) {
//           // Merge data points
//           existingDataset.data = [...existingDataset.data, ...incomingDataset.data];
//           existingDataset.priceChangeDetails = incomingDataset.priceChangeDetails;
//         } else {
//           // Create new dataset and push
//           existingCollection.chartData.datasets.push(incomingDataset);
//         }

//         // Collect all xy values (assuming you want to merge and de-duplicate)
//         existingCollection.chartData.allXYValues = [
//           ...new Set([
//             ...existingCollection.chartData.allXYValues,
//             ...incomingDataset.data.map((d) => d.xy),
//           ]),
//         ];
//       }
//     }

//     const filteredCards = filterUniqueCards(cards);
//     filteredCards.forEach((card) => {
//       card.chart_datasets = handleDuplicateYValuesInDatasets(card);
//     });

//     existingCollection.cards = filteredCards;
//     existingCollection.name = name;
//     existingCollection.description = description;
//     existingCollection.totalCost = totalCost;
//     existingCollection.quantity = quantity;
//     existingCollection.totalQuantity = totalQuantity;
//     existingCollection.xy = xy;

//     let parsedTotalCost = parseFloat(totalCost);
//     if (totalPrice === 0 && !isNaN(parsedTotalCost)) {
//       existingCollection.totalPrice = parsedTotalCost;
//     } else if (!isNaN(totalPrice)) {
//       existingCollection.totalPrice = totalPrice;
//     } else {
//       // Handle error case here if totalPrice is NaN.
//     }

//     await existingCollection.save();

//     return res.status(200).json({
//       data: {
//         message: 'Collection and ChartData successfully updated',
//         updatedCollection: existingCollection,
//       },
//     });
//   } catch (error) {
//     console.error('Failed to update collection:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// exports.updateAndSyncCollection = async (req, res, next) => {
//   let { userId, collectionId } = req.params;
//   const {
//     description,
//     name,
//     chartData,
//     totalCost,
//     quantity,
//     totalPrice,
//     cards,
//     totalQuantity,
//     xy,
//   } = req.body;

//   // Validate IDs and ensure they are in the correct format
//   userId = validObjectId(userId) ? userId : new mongoose.Types.ObjectId();
//   collectionId = validObjectId(collectionId) ? collectionId : new mongoose.Types.ObjectId();

//   try {
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const existingCollection = await Collection.findOne({ _id: collectionId, userId }).populate(
//       'chartData',
//     );
//     if (!existingCollection) return res.status(404).json({ message: 'Collection not found' });

//     const associatedChartData = existingCollection.chartData;
//     if (!associatedChartData)
//       return res.status(404).json({ message: 'ChartData not found for collection' });

//     const incomingDataset = chartData?.datasets?.[chartData.datasets.length - 1];
//     if (incomingDataset) {
//       const yValue = parseFloat(incomingDataset?.data[0]?.xy?.y);
//       if (isNaN(yValue)) {
//         return res.status(400).json({ message: 'Invalid dataset provided' });
//       }

//       // Update priceChangeDetails based on your logic (this is a stub; fill with actual logic if needed)
//       incomingDataset.priceChangeDetails = {
//         priceChanged: false,
//         initialPrice: 0,
//         updatedPrice: 0,
//         priceDifference: 0,
//         priceChange: 0,
//       };

//       incomingDataset.data[0].xy.y = yValue;
//     }

//     if (incomingDataset) {
//       const yValuesSet = new Set(associatedChartData.datasets.map((dataset) => dataset.data[0].y));
//       if (!yValuesSet.has(incomingDataset.data[0].xy.y)) {
//         associatedChartData.datasets.push(incomingDataset);
//         await associatedChartData.save();
//       }
//     }

//     if (chartData?.datasets) {
//       for (let incomingDataset of chartData.datasets) {
//         // Find the corresponding dataset in the existingCollection based on name or other criteria.
//         let dataset = existingCollection.chartData.datasets.find(
//           (ds) => ds.name === incomingDataset.name,
//         );

//         // If dataset doesn't exist in the existing collection, create it.
//         if (!dataset) {
//           dataset = { name: incomingDataset.name, data: [] };
//           existingCollection.chartData.datasets.push(dataset);
//         }

//         // Assuming incomingDataset.data is an array of xy objects.
//         for (let xyData of incomingDataset.data) {
//           dataset.data.push(xyData.xy); // Push each xy to the dataset's data array.
//         }
//       }
//     }
//     // Assume some functions like `filterUniqueCards` and `handleDuplicateYValuesInDatasets` are defined elsewhere
//     const filteredCards = filterUniqueCards(cards);
//     filteredCards.forEach((card) => {
//       card.chart_datasets = handleDuplicateYValuesInDatasets(card);
//     });

//     // Update Collection Data
//     existingCollection.cards = filteredCards;
//     existingCollection.name = name;
//     existingCollection.description = description;
//     existingCollection.totalCost = totalCost;
//     existingCollection.quantity = quantity;
//     existingCollection.totalQuantity = totalQuantity;
//     existingCollection.xy = xy;
//     console.log('XY DATA', existingCollection.xy);
//     // Check if totalPrice is 0, if so, convert totalCost to a number and set it to totalPrice
//     if (totalPrice === 0 && totalCost) {
//       existingCollection.totalPrice = parseFloat(totalCost);
//     } else {
//       existingCollection.totalPrice = totalPrice || existingCollection.totalPrice;
//     }
//     // Save the updated Collection
//     await existingCollection.save();

//     return res.status(200).json({
//       data: {
//         message: 'Collection and ChartData successfully updated',
//         updatedCollection: existingCollection,
//         updatedChartData: associatedChartData,
//       },
//     });
//   } catch (error) {
//     console.error('Failed to update collection:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// Helper function to check if a string is a valid ObjectId
