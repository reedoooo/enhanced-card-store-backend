const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validatePassword, createToken } = require('../services/auth');
// const mongoose = require('mongoose');
const Deck = require('../models/Deck');
const Collection = require('../models/Collection');
const winston = require('winston');
// const cardController = require('./CardController');
const { findUser } = require('../utils/utils');
const {
  handleValidationErrors,
  handleUpdateAndSync,
  handleServerError,
  handleNotFound,
  ensureCollectionExists,
  validObjectId,
} = require('./userControllerUtilities');
const { directError, directResponse } = require('./userControllerResponses');
const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES, ERROR_SOURCES } = require('../constants');
const { logger } = require('../middleware/infoLogger');
const SECRET_KEY = process.env.SECRET_KEY;

exports.signup = async (req, res) => {
  try {
    // Validation
    handleValidationErrors(req, res, () => {});

    // Data extraction
    const { login_data, basic_info, ...otherInfo } = req.body;
    const { username, password, email, role_data } = login_data;
    const { name } = basic_info;

    // Field checks
    if (!name || !email || !username || !password) {
      return directError(
        res,
        'SIGNUP',
        new CustomError(MESSAGES.REQUIRED_FIELDS_MISSING, STATUS.BAD_REQUEST),
      );
    }

    // Existing user check
    const existingUser = await User.findOne({ 'login_data.username': username.trim() });
    if (existingUser) {
      return directError(
        res,
        'SIGNUP',
        new CustomError(`${MESSAGES.USER_ALREADY_EXISTS} ${username}`, STATUS.CONFLICT),
      );
    }

    // Password hashing and user creation
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

    // Token generation
    const token = jwt.sign(
      {
        username: newUser.login_data.username,
        id: newUser._id,
        capabilities: newUser.login_data.role_data.capabilities,
      },
      SECRET_KEY,
    );

    return directResponse(res, 'SIGNUP', {
      status: STATUS.SUCCESS,
      message: MESSAGES.SIGNUP_SUCCESS,
      data: { token },
    });
  } catch (error) {
    console.log('Signup Error: ', error);
    logger.error('Signup Error: ', error);

    return directError(
      res,
      'SIGNUP',
      error instanceof CustomError
        ? error
        : new CustomError(MESSAGES.SIGNUP_ERROR, STATUS.INTERNAL_SERVER_ERROR, true, {
            source: ERROR_SOURCES.SIGNUP,
            detail: error.message || '',
            stack: error.stack,
          }),
    );
  }
};

exports.signin = async (req, res) => {
  try {
    // Step 1: Validate input.
    handleValidationErrors(req, res, () => {});

    // Step 2: Extract username and password from the request body.
    const { username, password } = req.body;

    // Step 3: Check for the existence of the secret key
    if (!process.env.SECRET_KEY) {
      throw new CustomError(
        `${MESSAGES.SIGNIN_ERROR} ${process.env.SECRET_KEY}`,
        STATUS.INTERNAL_SERVER_ERROR,
        true,
        {
          source: ERROR_SOURCES.SIGNIN,
          detail: 'Secret key is not set!',
        },
      );
    }

    // Step 4: Attempt to find the user in the database.
    const user = await User.findOne({ 'login_data.username': username.trim() });
    if (!user) {
      throw new CustomError(
        `${MESSAGES.INVALID_USERNAME},  ${process.env.SECRET_KEY}`,
        STATUS.INTERNAL_SERVER_ERROR,
        true,
        {
          source: ERROR_SOURCES.SIGNIN,
          detail: `User ${username} not found`,
        },
      );
    }

    // Step 5: Validate the provided password.
    const isPasswordValid = await bcrypt.compare(password, user.login_data.password);
    if (!isPasswordValid) {
      throw new CustomError(MESSAGES.INVALID_PASSWORD, STATUS.UNAUTHORIZED, true, {
        source: ERROR_SOURCES.SIGNIN,
        detail: 'Invalid Password',
      });
    }

    // Step 6: Generate a token for the user.
    const token = createToken({
      username: user.login_data.username,
      id: user._id,
      capabilities: user.login_data.role_data.capabilities,
    });

    // Step 7: Respond with a success message and the token.
    return directResponse(res, 'SIGNIN', {
      status: STATUS.SUCCESS,
      message: MESSAGES.SIGNIN_SUCCESS,
      data: { token },
    });
  } catch (error) {
    // Step 8: Handle errors.
    console.error('Signin Error:', error);

    return directError(
      res,
      'SIGNIN',
      error instanceof CustomError
        ? error
        : new CustomError(MESSAGES.SIGNIN_ERROR, STATUS.INTERNAL_SERVER_ERROR, true, {
            source: ERROR_SOURCES.SIGNIN,
            detail: error.message || '',
            stack: error.stack || '',
          }),
    );
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
    directError(
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

exports.getAllDecksForUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return handleNotFound('User', res);
    }

    user.allDecks = user.allDecks || []; // Ensure it's initialized

    const decks = (await Deck.find({ _id: { $in: user.allDecks } })) || [];

    if (decks.length === 0) {
      // Create and save a new default deck if no decks exist
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

    res.json(decks);
  } catch (error) {
    handleServerError(error, 'Error fetching all decks for user:', res, next);
  }
};

exports.updateAndSyncDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards, description, name, totalPrice } = req.body;

  try {
    // Find deck by ID and update
    const updatedDeck = await Deck.findOneAndUpdate(
      { _id: deckId, userId },
      { $set: { cards, name, description, totalPrice } },
      { new: true },
    );

    if (!updatedDeck) {
      return res.status(404).send({ error: 'Deck not found' });
    }

    res.send(updatedDeck);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to update deck' });
  }
};

exports.createNewDeck = async (req, res, next) => {
  const { userId } = req.params;
  const { name, description, cards, totalPrice } = req.body;

  try {
    const newDeck = new Deck({ userId, name, description, cards, totalPrice });
    await newDeck.save();

    // console.log('New Deck Created:', newDeck); // NEW LINE
    // console.log('New Deck Name:', newDeck.name); // NEW LINE
    // console.log('New Deck Description:', newDeck.description); // NEW LINE

    res.send(newDeck);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to create new deck' });
  }
};

exports.createNewCollection = async (req, res, next) => {
  let { userId } = req.params;
  const {
    cards,
    description,
    name,
    totalPrice,
    chartData,
    totalCost,
    allCardPrices,
    quantity,
    xys,
    totalQuantity,
  } = req.body;

  // if (!userId) return res.status(400).json({ error: 'Invalid user ID' });
  userId = validObjectId(userId) ? userId : null;
  // if (!userId) {
  //   directError(res, 'INVALID_USER_ID', new Error('Invalid user ID'));
  //   return;
  // }
  if (!userId) {
    throw new CustomError('Invalid user ID', 400);
  }
  try {
    await ensureCollectionExists(userId); // Ensure collection exists

    const newCollection = new Collection({
      userId,
      name,
      description,
      cards: cards || [],
      totalPrice: totalPrice || 0,
      totalCost: totalCost || 0,
      allCardPrices: allCardPrices || [],
      quantity: quantity || 0,
      xys: Array.isArray(xys) ? xys : [],
      totalQuantity: totalQuantity || 0,
      chartData: {
        datasets: chartData?.datasets || [],
        allXYValues: chartData?.allXYValues || [],
        xys: Array.isArray(xys) ? xys : [],
      },
    });

    const savedCollection = await newCollection.save();

    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    user.allCollections.push(savedCollection._id);
    await user.save();

    winston.info('New Collection Created:', savedCollection);
    // res.status(201).json({
    //   data: {
    //     message: 'New collection created successfully',
    //     newCollection: savedCollection,
    //   },
    // });
    // directResponse(res, {
    //   message: 'New collection created successfully',
    //   data: { newCollection: savedCollection },
    // });
    return directResponse(res, 'CREATE_NEW_COLLECTION', {
      status: STATUS.SUCCESS,
      message: MESSAGES.CREATE_NEW_COLLECTION_SUCCESS,
      data: { newCollection: savedCollection },
    });
  } catch (error) {
    // handleServerError(error, 'Failed to create new collection', res, next);
    directError(res, 'CREATE_COLLECTION_ERROR', error);
  }
};

exports.getAllCollectionsForUser = async (req, res, next) => {
  try {
    const userId = validObjectId(req.params.userId) ? req.params.userId : null;
    // if (!userId) return res.status(400).json({ error: 'Invalid user ID' });
    // if (!userId) {
    //   directError(res, 'INVALID_USER_ID', new Error('Invalid user ID'));
    //   return;
    // }
    if (!userId) {
      throw new CustomError('Invalid user ID', 400);
    }
    // const user = await User.findById(userId).populate({
    //   path: 'allCollections',
    //   populate: { path: 'chartData', model: 'ChartData' },
    // });
    const user = await User.findById(userId).populate('allCollections');

    // if (!user) return handleNotFound('User', res);
    // if (!user) {
    //   directError(res, 'USER_NOT_FOUND', new Error('User not found'));
    //   return;
    // }
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    winston.info(`Fetched ${user.allCollections.length} collections for user ${userId}`);
    // res.status(200).json(user.allCollections);
    // directResponse(res, {
    //   data: user.allCollections,
    //   message: `Fetched ${user.allCollections.length} collections for user ${userId}`,
    // });
    return directResponse(res, 'GET_ALL_COLLECTIONS_FOR_USER', {
      status: STATUS.SUCCESS,
      message: `Fetched ${user.allCollections.length} collections for user ${userId}`,
      data: { allCollections: user.allCollections },
    });
  } catch (error) {
    // handleServerError(error, 'Error fetching all collections for user:', res, next);
    directError(res, 'FETCH_COLLECTIONS_ERROR', error);
  }
};

exports.updateAndSyncCollection = async (req, res, next) => {
  try {
    const { userId, collectionId } = req.params;
    if (!validObjectId(userId) || !validObjectId(collectionId)) {
      throw new CustomError('Invalid user or collection ID', 400);
    }
    // if (!validObjectId(userId) || !validObjectId(collectionId)) {
    //   directError(res, 'INVALID_IDS', new Error('Invalid user or collection ID'));
    //   return;
    // }
    const result = await handleUpdateAndSync(userId, collectionId, req.body);
    // res.status(200).json(result);
    // return directResponse(res, { data: result });
    return directResponse(res, 'UPDATE_AND_SYNC_COLLECTION_SUCCESS', {
      status: STATUS.SUCCESS,
      message: `Updated collection with id: ${collectionId} for user ${userId}`,
      data: { data: result },
    });
  } catch (error) {
    // console.error('[7][USER CONTROLLER] Error updating and syncing collection:', error);
    // res.status(500).json({ error: 'Internal Server Error' });
    // return next(error); // Pass the error to the next middleware (possibly a centralized error handler)
    // handleServerError(error, 'Error updating and syncing collection:', res, next);
    directError(res, 'UPDATE_AND_SYNC_COLLECTION_ERROR', error);
  }
};

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
