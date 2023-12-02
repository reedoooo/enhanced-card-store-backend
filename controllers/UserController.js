const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const { validatePassword, createToken } = require('../services/auth');
// const mongoose = require('mongoose');
const Deck = require('../models/Deck');
const Collection = require('../models/Collection');
const winston = require('winston');
const {
  handleValidationErrors,
  handleUpdateAndSync,
  handleCardUpdate,
  handleChartDataUpdate,
} = require('./userControllerUtilities');
const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES, ERROR_TYPES } = require('../constants');
const { logToAllSpecializedLoggers, directError } = require('../middleware/infoLogger');
const { logCollection } = require('../utils/collectionLogTracking');
const { isObjectIdOrHexString, default: mongoose } = require('mongoose');
const { respondWithError, getCardInfo } = require('../utils/utils');
const { response } = require('express');
const User = require('../models/User');
const SECRET_KEY = process.env.SECRET_KEY;

// Enhanced error logging
const logError = (message, error) => {
  logToAllSpecializedLoggers('error', message, { section: 'errors', error }, 'log');
};

// Enhanced info logging
const logInfo = (message, status, data) => {
  logToAllSpecializedLoggers(
    'info',
    status.green + ' | ' + message,
    { section: 'info', data: data },
    'log',
  );
};
// Utility: Extract Data
const extractData = ({ body }) => {
  const { login_data, basic_info, ...otherInfo } = body;
  return { login_data, basic_info, otherInfo };
};
const generateToken = (userData) => {
  return jwt.sign(userData, process.env.SECRET_KEY || 'YOUR_SECRET_KEY');
};
exports.signup = async (req, res, next) => {
  try {
    handleValidationErrors(req, res);

    const { login_data, basic_info, otherInfo } = extractData(req);
    const { username, password, email, role_data } = login_data || {};
    const { name } = basic_info || {};

    if (!name || !email || !username || !password) {
      logInfo('Missing required fields', STATUS.BAD_REQUEST, { login_data, basic_info });
    }

    const existingUser = await User.findOne({ 'login_data.username': username.trim() });
    if (existingUser) {
      logInfo('User already exists', STATUS.CONFLICT, { username });
      throw new CustomError(MESSAGES.USER_ALREADY_EXISTS, STATUS.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const newUser = new User({
      login_data: {
        ...login_data,
        username: username.trim(),
        password: hashedPassword,
        email: email.trim(),
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

    logInfo('User created successfully', STATUS.SUCCESS, { username });
    res.status(201).json({
      message: 'User created successfully',
      data: { token },
    });
  } catch (error) {
    console.log('Signup Error: ', error);
    logError('Signup Error: ', error);
    next(error);
  }
};

exports.signin = async (req, res, next) => {
  try {
    handleValidationErrors(req, res);

    const { username, password } = req.body;

    if (!process.env.SECRET_KEY) {
      logToAllSpecializedLoggers('info', { section: 'signin' });
      throw new CustomError(ERROR_TYPES.SECRET_KEY_MISSING, STATUS.INTERNAL_SERVER_ERROR);
    }

    const user = await User.findOne({ 'login_data.username': username.trim() });
    if (!user) {
      logError('User not found', new Error(MESSAGES.USER_NOT_FOUND));
      throw new CustomError(MESSAGES.INVALID_USERNAME, STATUS.NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(password, user.login_data.password);
    if (!isPasswordValid) {
      logError('Invalid password', new Error(MESSAGES.INVALID_PASSWORD));
      throw new CustomError(MESSAGES.INVALID_PASSWORD, STATUS.UNAUTHORIZED);
    }

    const token = generateToken({
      username: user.login_data.username,
      id: user._id,
      capabilities: user.login_data.role_data.capabilities,
    });

    logInfo('User signed in successfully', STATUS.SUCCESS, { username });
    res.status(200).json({
      message: 'Fetched user data successfully',
      data: { token },
    });
  } catch (error) {
    console.log('Signin Error: ', error);
    // Use headersSent to check if headers are already sent to the client
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

    response.status(200).json({
      message: 'Fetched user data successfully',
      data: user,
    });
  } catch (error) {
    console.error('Get Profile Error: ', error);
    next(error);
  }
};
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.authData.id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    response.status(200).json({
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update Profile Error: ', error);
    next(error);
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

    response.status(200).json({
      message: 'Profile deleted successfully',
      data: user,
    });
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
    // directResponse(res, { data: user });
    response.status(200).json({
      message: 'Fetched user data successfully',
      data: user,
    });
  } catch (error) {
    console.error('Get User By ID Error: ', error);
    next(error);
  }
};
// exports.getAllDecksForUser = async (req, res, next) => {
//   const userId = req.params.userId;

//   if (!userId) {
//     return next(new CustomError('User ID is required', 400));
//   }

//   try {
//     const user = await User.findById(userId).populate('allDecks');

//     if (!user) {
//       throw new CustomError('User not found', 404);
//     }

//     let decks = await Deck.find({ _id: { $in: user.allDecks } });

//     if (decks.length === 0) {
//       const newDeck = new Deck({
//         userId: user._id,
//         name: 'Default Deck',
//         description: 'This is your default deck.',
//         cards: [],
//       });

//       await newDeck.save();
//       user.allDecks.push(newDeck._id);
//       await user.save();
//       decks = [newDeck];
//     }

//     res.status(200).json({
//       message: 'Fetched all decks successfully',
//       data: decks,
//     });
//   } catch (error) {
//     console.error('Error fetching decks:', error);
//     next(error);
//   }
// };

exports.getAllDecksForUser = async (req, res, next) => {
  const userId = req.params.userId; // Already validated by middleware

  if (!userId) {
    // Pass the error to the next middleware, which is the unified error handler
    return next(new CustomError('User ID is required', 400));
  }
  // console.log('User1:', userId);

  try {
    // const user = await User.find({ _id: userId }).populate('allDecks');
    const user = await User.findById(userId).populate('allDecks');
    if (!user) {
      logError('User not found', new Error(MESSAGES.USER_NOT_FOUND));
      throw new CustomError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
    }

    // console.log('User2:', user);
    // console.log('User3:', user.allDecks);

    user.allDecks = user.allDecks || [];

    let decks = await Deck.find({ _id: { $in: user.allDecks } });
    // const decks = await Deck.find({ _id: { $in: user.allDecks } });

    // console.log('Decks:', decks);
    if (decks.length === 0) {
      const newDeck = new Deck({
        userId: user._id,
        name: 'Default Deck',
        description: 'This is your default deck.',
        cards: [],
      });

      await newDeck.save();
      user?.allDecks.push(newDeck._id);

      // await user?.save();
      await user?.save();
      decks.push(newDeck);

      // console.log('New deck:', newDeck);
    }

    // console.log('Decks:', decks);

    // await user?.save();
    // Directly send a successful response
    res.status(200).json({
      message: 'Fetched all decks successfully',
      data: decks,
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    logError('Error fetching decks:', error);
    next(error); // Let the unified error handler deal with it
  }
};

exports.updateAndSyncDeck = async (req, res, next) => {
  try {
    const { userId, deckId } = req.params;
    let { cards, description, name, totalPrice } = req.body;
    const user = await User.findById(req.params.userId).populate('allDecks');

    console.log('Request body:', req.body);

    // Ensure cards is an array
    if (!Array.isArray(cards)) {
      console.error('cards is not an array:', cards);
      throw new CustomError('Invalid cards format. Expected an array.', 400);
    }

    // cards = [{}]
    console.log('CARDS', cards);

    const updatedDeck = await Deck.findOneAndUpdate(
      { _id: deckId, userId },
      { $set: { cards: cards, name, description, totalPrice } },
      { new: true },
    );

    if (!updatedDeck) {
      throw new CustomError('Deck not found', 404);
    }

    await updatedDeck.save();

    await user.save();

    // Directly send a successful response
    res.status(200).json({
      message: 'Deck updated successfully',
      data: updatedDeck,
    });
  } catch (error) {
    next(error);
  }
};

exports.createNewDeck = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, description, cards, totalPrice } = req.body;
    const user = await User.findById(req.params.userId);

    console.log('Request body:', req.body);
    console.log('Request body:', req.body.name);
    const newDeck = new Deck({ userId, name, description, cards, totalPrice });
    await newDeck.save();

    user.allDecks.push(newDeck._id);
    await user.save();

    // Directly send a successful response
    res.status(201).json({
      message: 'New deck created successfully',
      data: newDeck,
    });
  } catch (error) {
    next(error);
  }
};

const createCollectionObject = (body, userId) => {
  return {
    userId: body.userId || userId, // Use userId from body if available, else use the passed userId
    name: body.name || '',
    description: body.description || '',
    totalCost: body.totalCost || '',
    totalPrice: body.totalPrice || 0,
    quantity: body.quantity || 0,
    totalQuantity: body.totalQuantity || 0,
    dailyPriceChange: body.dailyPriceChange || '',
    priceDifference: body.priceDifference || 0,
    priceChange: body.priceChange || 0,
    previousDayTotalPrice: body.previousDayTotalPrice || 0,
    latestPrice: {
      // Ensuring latestPrice is populated correctly
      num: body.latestPrice?.num || 0,
      timestamp: body.latestPrice?.timestamp || new Date(),
    },
    lastSavedPrice: {
      // Ensuring lastSavedPrice is populated correctly
      num: body.lastSavedPrice?.num || 0,
      timestamp: body.lastSavedPrice?.timestamp || new Date(),
    },
    // allCardPrices: Array.isArray(body.allCardPrices) ? body.allCardPrices : [],
    cards: Array.isArray(body.cards) ? body.cards : [],
    currentChartDataSets2: Array.isArray(body.currentChartDataSets2)
      ? body.currentChartDataSets2
      : [],
    // xys: Array.isArray(body.xys) ? body.xys : [],
    collectionPriceHistory: Array.isArray(body.collectionPriceHistory)
      ? body.collectionPriceHistory
      : [],
    dailyCollectionPriceHistory: Array.isArray(body.dailyCollectionPriceHistory)
      ? body.dailyCollectionPriceHistory
      : [],
    chartData: {
      // Ensuring chartData is populated correctly
      name: body.chartData?.name || `Chart for ${body.name || 'Collection'}`,
      userId: body.chartData?.userId || body.userId || userId,
      datasets: Array.isArray(body.chartData?.datasets) ? body.chartData.datasets : [],
      allXYValues: Array.isArray(body.chartData?.allXYValues) ? body.chartData.allXYValues : [],
      // xys: Array.isArray(body.chartData?.xys) ? body.chartData.xys : [],
    },
  };
};
// Helper function to fetch and validate user and collection
// async function fetchAndValidateUserAndCollection(userId, collectionId) {
//   const user = await User.findById(userId).populate('allCollections');
//   if (!user) throw new Error('User not found');

//   const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);
//   if (!collection) throw new Error('Collection not found');

//   return { user, collection };
// }
// exports.getAllCollectionsForUser = async (req, res, next) => {
//   try {
//     const userId = req.params.userId; // Already validated by middleware
//     console.log('User ID:', userId);
//     const user = await User.findById(userId).populate('allCollections');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found', data: user });
//     }

//     logInfo('Fetched all collections for user', { userId });
//     // const allUserCollections = user.allCollections || [];
//     // const filteredCollections = filterNullPriceHistory(user.allCollections);

//     await user.populate('allCollections');

//     // await user.save();
//     // user.markModified('allCollections');
//     // await user.save();
//     // console.log('Filtered collections:', filteredCollections);
//     res.status(200).json({
//       message: `Fetched collections for user ${userId}`,
//       data: user.allCollections,
//     });
//   } catch (error) {
//     logError('Error fetching collections', { error });
//     next(error);
//   }
// };
exports.getAllCollectionsForUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    console.log('USER ID --------', userId);
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    const user = await User.findById(userId).populate('allCollections');
    if (!user) {
      return res.status(404).json({ message: 'User not found', data: user });
    }

    await user.populate('allCollections');

    logInfo('Fetched all collections for user', { userId });
    res.status(200).json({
      message: `Fetched collections for user ${userId}`,
      data: user?.allCollections,
    });
  } catch (error) {
    logError('Error fetching collections', { error });
    next(error);
  }
};

exports.createNewCollection = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newCollectionData = createCollectionObject(req.body, userId);
    const newCollection = new Collection(newCollectionData);
    await newCollection.save();

    logInfo('createNewCollection', { newCollection });

    // Ensure allCollections is initialized and is an array
    if (!user.allCollections) {
      user.allCollections = []; // Initialize if undefined
    }

    user.allCollections.push(newCollection);

    await user.save();

    res.status(201).json({
      message: 'New collection created successfully',
      data: newCollection,
    });
  } catch (error) {
    logError('Error in createNewCollection', error);
    next(error);
  }
};

exports.addCardsToCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards } = req.body;

  try {
    const user = await User.findById(userId).populate('allCollections');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!Array.isArray(cards)) {
      return res.status(400).json({ message: 'Invalid card data, expected an array' });
    }

    const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const existingCardsMap = new Map(
      collection.cards.map((card) => [`${card.id}-${card.name}`, card]),
    );

    for (let cardUpdate of cards) {
      const uniqueKey = `${cardUpdate.id}-${cardUpdate.name}`;
      let card = existingCardsMap.get(uniqueKey);

      if (card) {
        card = { ...card, ...cardUpdate };

        if (card.quantity !== cardUpdate.quantity) {
          if (
            !cardUpdate.name ||
            !cardUpdate.id ||
            !cardUpdate.type ||
            !cardUpdate.desc ||
            !cardUpdate.card_images[0] ||
            !cardUpdate.card_prices
          ) {
            try {
              const updatedCardData = await getCardInfo(cardUpdate.id);
              cardUpdate = { ...cardUpdate, ...updatedCardData };
            } catch (error) {
              console.error(`Error fetching card data for card ID ${cardUpdate.id}:`, error);
              continue;
            }
          }
        }

        existingCardsMap.set(uniqueKey, card);
      } else {
        card = { ...cardUpdate };
        existingCardsMap.set(uniqueKey, card);
      }
    }

    collection.cards = Array.from(existingCardsMap.values());

    // Save the updated collection
    await collection.save();

    // Mark the subdocument as modified and save the user document if needed
    user.markModified('allCollections');
    if (user.isModified()) {
      console.log('Saving user with updated collection...');
      await user.save();
    }

    res.status(200).json({ message: 'Cards updated successfully', cards: collection.cards });
  } catch (error) {
    console.error('Error updating cards in addCardsToCollection:', error);
    respondWithError(res, 500, 'Error updating cards in addCardsToCollection', error);
    next(error);
  }
};

// exports.addCardsToCollection = async (req, res, next) => {
//   const { userId, collectionId } = req.params;
//   console.log('UserId:', userId); // Debugging
//   const { cards } = req.body; // Expecting an array of card objects

//   const user = await User?.findOne({ _id: userId }).populate('allCollections');

//   if (!Array.isArray(cards)) {
//     return res.status(400).json({ message: 'Invalid card data, expected an array' });
//   }

//   try {
//     const collection = await Collection.findOne({ _id: collectionId, userId: userId });
//     if (!collection) {
//       return res.status(404).json({ message: 'Collection not found' });
//     }

//     for (let cardUpdate of cards) {
//       if (existingCardIndex >= 0) {

//       // Check for missing or empty values
//       if (collection.cards[existingCardIndex].quantity !== cardUpdate.quantity) {
//         if (
//           !cardUpdate.id ||
//           !cardUpdate.name ||
//           !cardUpdate.type ||
//           !cardUpdate.desc ||
//           !cardUpdate.card_images[0] ||
//           !cardUpdate.card_prices
//         ) {
//           try {
//             // Fetch the card data again
//             const updatedCardData = await getCardInfo(cardUpdate.id);
//             cardUpdate = { ...cardUpdate, ...updatedCardData };
//           } catch (error) {
//             console.error(`Error fetching card data for card ID ${cardUpdate.id}:`, error);
//             continue; // Skip to the next card if unable to fetch data
//           }
//         }
//       }

//       const existingCardIndex = collection?.cards.findIndex((card) => card?.id === cardUpdate.id);

//       // if (existingCardIndex >= 0) {
//       //   // Update existing card
//       //   collection.cards[existingCardIndex] = {
//       //     ...collection.cards[existingCardIndex],
//       //     ...cardUpdate,
//       //     price: cardUpdate.price || collection.cards[existingCardIndex].price,
//       //   };
//       // } else {
//       //   // Add new card
//       //   collection.cards.push({
//       //     ...cardUpdate,
//       //     price: cardUpdate.price || cardUpdate.card_prices?.[0]?.tcgplayer_price,
//       //   });
//       // }
//     // }

//     await collection.save();
//     await user.populate('allCollections');
//     res.status(200).json({ message: 'Cards updated successfully', cards: collection.cards });
//   } catch (error) {
//     console.error('Error updating cards in addCardsToCollection: ', error);
//     respondWithError(res, 500, 'Error updating cards in addCardsToCollection', error);
//     next(error);
//   }
// };

// exports.addCardsToCollection = async (req, res, next) => {
//   const { userId, collectionId } = req.params;
//   console.log('UserId:', userId); // Debugging
//   const { cards } = req.body; // Expecting an array of card objects
//   // const user = await User?.findById({ _id: userId }).populate('allCollections');
//   const user = await User?.findOne({ _id: userId }).populate('allCollections');

//   if (!Array.isArray(cards)) {
//     return res.status(400).json({ message: 'Invalid card data, expected an array' });
//   }

//   try {
//     // Find the collection by its ID and the user's ID
//     const collection = await Collection.findOne({ _id: collectionId, userId: userId });
//     if (!collection) {
//       return res.status(404).json({ message: 'Collection not found' });
//     }

//     // Update or add cards to the collection
//     cards.forEach((cardUpdate) => {
//       const existingCardIndex = collection?.cards.findIndex((card) => card?.id === cardUpdate.id);

//       if (existingCardIndex >= 0) {
//         // Update existing card
//         collection.cards[existingCardIndex] = {
//           ...collection.cards[existingCardIndex],
//           ...cardUpdate,
//           price: cardUpdate.price || collection.cards[existingCardIndex].price,
//         };
//       } else {
//         // Add new card
//         collection.cards.push({
//           ...cardUpdate,
//           price: cardUpdate.price || cardUpdate.card_prices?.[0]?.tcgplayer_price,
//         });
//       }
//     });

//     // Save the updated collection
//     await collection.save();

//     // Re-populate allCollections to return full collection data
//     await user.populate('allCollections'); // Correct way

//     res.status(200).json({ message: 'Cards updated successfully', cards: collection.cards });
//   } catch (error) {
//     console.error('Error updating cards in addCardsToCollection: ', error);
//     respondWithError(res, 500, 'Error updating cards in addCardsToCollection', error);
//     next(error);
//   }
// };
exports.removeCardsFromCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cardIds } = req.body; // Expecting an array of card IDs to be removed
  const user = await User.findById(userId).populate('allCollections');
  let cards2Remove = cardIds;
  // let card = null;
  console.log('Request body:', req.body);
  console.log('Request params:', req.params);

  if (!isObjectIdOrHexString(cardIds) && !Array.isArray(cardIds)) {
    return res.status(400).json({ message: 'Invalid card IDs' });
  }

  if (isObjectIdOrHexString(cardIds._id)) {
    // Convert the card ID to an array
    cards2Remove = [cards2Remove];
    console.log('cards', cards2Remove);
  }

  console.log('Card IDs:', cardIds);
  console.log('Collection ID:', collectionId);

  try {
    // Find the collection by its ID and the user's ID
    const collection = await Collection.findOne({ _id: collectionId, userId: userId });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    console.log('REMOVED CArD WITH ID', cards2Remove.id);

    // Remove the cards from the collection
    // collection.cards = collection.cards.filter((card) => !cards2Remove.includes(card.id));
    collection.cards = collection.cards.filter((card) => !cards2Remove.includes(card.id));

    // console.log('REMOVED CArD WITH ID', cards2Remove.id);
    // Save the updated collection
    await collection.save();

    // Re-populate allCollections to return full collection data
    await user.populate('allCollections'); // Correct way

    res.status(200).json({ message: 'Cards removed successfully', cards: collection.cards });
  } catch (error) {
    console.error('Error updating cards:', error);
    logError('Error updating in remove removeCardsFromCollection :', error);
    respondWithError(res, 500, 'Error updating cards', error);
    next(error);
  }
};
// exports.updateCardsInCollection = async (req, res, next) => {
exports.updateCardsInCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards, cardIds } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // const collectionIndex = user.allCollections.findIndex(
    //   (coll) => coll._id.toString() === collectionId,
    // );
    // if (collectionIndex === -1) {
    //   return res.status(404).json({ message: 'Collection not found' });
    // }
    // const collection = user.allCollections[collectionIndex];
    const existingCardsMap = new Map(collection.cards.map((card) => [card.id, card]));

    // Handle card removals
    if (cardIds) {
      const cardToRemove = existingCardsMap.get(cardIds.id);
      if (cardToRemove) {
        if (cardToRemove.quantity > 1) {
          cardToRemove.quantity -= 1;
        } else {
          existingCardsMap.delete(cardIds.id);
        }
      }
    }

    // // Handle card removals
    // if (cardIds) {
    //   cardIds.forEach(id => {
    //     if (existingCardsMap.has(id)) {
    //       const card = existingCardsMap.get(id);
    //       if (card.quantity > 1) {
    //         card.quantity -= 1;
    //       } else {
    //         existingCardsMap.delete(id);
    //       }
    //     }
    //   });
    // }
    // Handle card updates
    // if (cards && Array.isArray(cards)) {
    //   cards.forEach((cardUpdate) => {
    //     let card = existingCardsMap.get(cardUpdate.id);
    //     if (card) {
    //       // Update existing card
    //       existingCardsMap.set(cardUpdate.id, {
    //         ...card,
    //         ...cardUpdate,
    //         price: cardUpdate.price ?? card.price,
    //         totalPrice: cardUpdate.totalPrice ?? card.totalPrice ?? card.price * card.quantity,
    //         quantity: cardUpdate.quantity ?? card.quantity,
    //       });
    //     } else {
    //       // Add new card
    //       existingCardsMap.set(cardUpdate.id, { ...cardUpdate });
    //     }
    //   });
    // }
    // Handle card updates
    if (cards && Array.isArray(cards)) {
      cards.forEach((cardUpdate) => {
        let card = existingCardsMap.get(cardUpdate.id);

        console.log('Card update:', cardUpdate?.totalPrice);
        if (card) {
          // Update existing card
          card = {
            ...card,
            ...cardUpdate,
            price: cardUpdate.price ?? card.price,
            totalPrice: cardUpdate.totalPrice ?? card.totalPrice ?? card?.price * card?.quantity,
            quantity: cardUpdate.quantity ?? card.quantity,
            lastSavedPrice: card.lastSavedPrice,
            latestPrice: { num: cardUpdate.price, timestamp: new Date() },
          };
        } else {
          // Add new card
          card = { ...cardUpdate };
        }
        existingCardsMap.set(cardUpdate.id, card);
      });
    }
    // Handling card removals and updates
    // cardIds?.forEach(id => existingCardsMap.delete(id));
    // cards?.forEach(cardUpdate => existingCardsMap.set(cardUpdate.id, { ...cardUpdate }));

    // Update collection with unique cards
    // collection.cards = Array.from(existingCardsMap.values());
    // user.markModified('allCollections');
    // await user.save();

    // return res
    //   .status(200)
    //   .json({ message: 'Collection updated successfully', cards: collection.cards });
    collection.cards = Array.from(existingCardsMap.values());
    await collection.save();

    return res
      .status(200)
      .json({ message: 'Collection updated successfully', cards: collection.cards });
  } catch (error) {
    console.error('Error updating cards in updateCardsInCollection:', error);
    res.status(500).json({ message: 'Error updating cards in updateCardsInCollection' });
    next(error);
  }
};
exports.updateChartDataInCollection = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    const updatedChartData = req.body.chartData;

    const collection = await Collection.findById(collectionId);
    const user = await User.findById(collection.userId).populate('allCollections');

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Validate the chart data if necessary

    // Update the chart data in the collection document
    collection.chartData = updatedChartData; // Merge or replace the chart data

    await collection.save();

    await user.populate('allCollections'); // Re-populate allCollections to return full collection data
    // Log the updated chart data
    logInfo('Updated chart data', { collectionId, updatedChartData });

    // Return the updated chart data
    return res
      .status(200)
      .json({ chartMessage: 'Chart data updated successfully', chartData: collection.chartData });
  } catch (error) {
    console.error('Error updating cards in updateChartDataInCollection:', error);
    // loggers.error('Error updating cards:', error);
    respondWithError(res, 500, 'Error updating cards in updateChartDataInCollection', error);
    next(error);
  }
};
exports.updateAndSyncCollection = async (req, res, next) => {
  const { collectionId, userId } = req.params;
  const updatedCollectionData = req.body.updatedCollection;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const collectionIndex = user.allCollections.findIndex(
      (coll) => coll._id.toString() === collectionId,
    );
    if (collectionIndex === -1) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Update the collection with the new data
    Object.assign(user.allCollections[collectionIndex], updatedCollectionData);
    user.markModified('allCollections');
    await user.save();

    return res.status(200).json({
      message: 'Collection updated successfully',
      collectionData: user.allCollections[collectionIndex],
    });
  } catch (error) {
    logError('Error updating collection in updateAndSyncCollection:', error);
    return res
      .status(500)
      .json({ message: 'Error updating collection in updateAndSyncCollection' });
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
    console.error('Error updating collection in deleteCollection:', error);
    // loggers.error('Error updating cards:', error);
    respondWithError(res, 500, 'Error updating collection in deleteCollection', error);
    next(error);
  }
};
// exports.updateAndSyncCollection = async (req, res, next) => {
//   let attempts = 0;
//   const maxAttempts = 3; // Set a reasonable limit for retries

//   while (attempts < maxAttempts) {
//     try {
//       const { collectionId, userId } = req.params;
//       const updatedCollectionData = req.body.updatedCollection;

//       const user = await User.findById(userId).populate('allCollections');
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }

//       const collection = await Collection.findById(collectionId);
//       if (!collection) {
//         return res.status(404).json({ message: 'Collection not found' });
//       }

//       // Update the collection with the new data
//       for (const key in updatedCollectionData) {
//         if (Object.prototype.hasOwnProperty.call(updatedCollectionData, key)) {
//           collection[key] = updatedCollectionData[key];
//         }
//       }

//       await collection.save();

//       // Re-populate allCollections to return full collection data
//       await user.populate('allCollections');

//       // save collection in user.allCollections

//       await user.save();

//       return res.status(200).json({
//         message: 'Collection updated successfully',
//         collectionData: collection,
//       });
//     } catch (error) {
//       logError('Error updating collection in updateAndSyncCollection:', error);
//       if (error instanceof mongoose.Error.VersionError) {
//         attempts++;
//         console.log(
//           `Retrying update for collection ${req.params.collectionId}, attempt ${attempts}`,
//         );
//         if (attempts === maxAttempts) {
//           return res
//             .status(500)
//             .json({ message: 'Failed to update collection after multiple attempts' });
//         }
//       } else {
//         console.error('Error updating collection in updateAndSyncCollection:', error);
//         return res
//           .status(500)
//           .json({ message: 'Error updating collection in updateAndSyncCollection' });
//       }
//     }
//   }
// };

// exports.updateCardsInCollection = async (req, res, next) => {
//   const { collectionId } = req.params;
//   const { cards, cardIds } = req.body;

//   try {
//     const collection = await Collection.findById(collectionId);
//     if (!collection) {
//       return res.status(404).json({ message: 'Collection not found' });
//     }

//     // Handle card removal or reduction
//     if (cardIds) {
//       const cardToRemoveIndex = collection.cards.findIndex((card) => card.id === cardIds.id);
//       if (cardToRemoveIndex !== -1) {
//         const cardToRemove = collection.cards[cardToRemoveIndex];
//         if (cardToRemove.quantity > 1) {
//           collection.cards[cardToRemoveIndex].quantity -= 1;
//         } else {
//           collection.cards.splice(cardToRemoveIndex, 1);
//         }
//       }
//     }

//     // Handle card updates
//     if (cards && Array.isArray(cards)) {
//       cards.forEach((cardUpdate) => {
//         const cardIndex = collection.cards.findIndex((card) => card.id === cardUpdate.id);
//         if (cardIndex !== -1) {
//           const card = collection.cards[cardIndex];
//           const lastSavedPrice = {
//             num: card.price,
//             timestamp: card.lastSavedPrice?.timestamp || new Date(),
//           };
//           const latestPrice = {
//             num: cardUpdate.price,
//             timestamp: new Date(),
//           };
//           collection.cards[cardIndex] = {
//             ...card,
//             ...cardUpdate,
//             price: cardUpdate.price ?? card.price,
//             quantity: cardUpdate.quantity ?? card.quantity,
//             lastSavedPrice: lastSavedPrice || card.price, // Update last saved price
//             latestPrice: latestPrice,
//           };
//         } else {
//           if (cardUpdate.id && cardUpdate.price !== undefined) {
//             collection.cards.push(cardUpdate);
//           }
//         }
//       });
//     }

//     await collection.save();
//     return res
//       .status(200)
//       .json({ message: 'Collection updated successfully', cards: collection.cards });
//   } catch (error) {
//     console.error('Error updating cards in updateCardsInCollection:', error);
//     respondWithError(res, 500, 'Error updating cards in updateCardsInCollection', error);
//     next(error);
//   }
// };

// exports.updateAndSyncCollection = async (req, res, next) => {
//   let attempts = 0;
//   const maxAttempts = 3; // Set a reasonable limit for retries

//   while (attempts < maxAttempts) {

//   try {
//     const { collectionId, userId } = req.params;
//     const updatedCollectionData = req.body.updatedCollection;
//     // console.log('Updated collection data:', updatedCollectionData);
//     const user = await User.findById(userId).populate('allCollections');

//     const collection = await Collection.findById(collectionId);
//     if (!collection) {
//       return res.status(404).json({ message: 'Collection not found' });
//     }
//     // Validate the update
//     // validateCollectionUpdate(updatedCollectionData, collection.toObject());

//     // Update the collection with the new data
//     for (const key in updatedCollectionData) {
//       // eslint-disable-next-line no-prototype-builtins
//       if (updatedCollectionData.hasOwnProperty(key)) {
//         collection[key] = updatedCollectionData[key];
//       }
//     }

//     await collection.save();

//     // Re-populate allCollections to return full collection data
//     await user?.populate('allCollections'); // Correct way
//     return res
//       .status(200)
//       .json({ collectionMessage: 'Collection updated successfully', collectionData: collection });
//   } catch (error) {
//     if (error instanceof mongoose.Error.VersionError) {
//       attempts++;
//       console.log(`Retrying update for collection ${collectionId}, attempt ${attempts}`);
//     } else {
//       // throw error; // Rethrow if it's not a VersionError
//     console.error('Error updating collection in updateAndSyncCollection:', error);
//     respondWithError(res, 500, 'Error updating collection in updateAndSyncCollection', error);
//     // next(error);
//     throw error; // Rethrow if it's not a VersionError
//   }
// };

// Helper to log and respond with error
// exports.updateCardsInCollection = async (req, res, next) => {
//   try {
//     const { userId, collectionId } = req.params;
//     const existingCollection = await Collection.findById(collectionId);
//     if (!existingCollection) {
//       return res.status(404).json({ message: 'Collection not found' });
//     }

//     const incomingCards = req.body.cards;
//     if (!Array.isArray(incomingCards)) {
//       return res.status(400).json({ message: 'Invalid card data' });
//     }

//     const updateCardsResult = await handleCardUpdate({ userId, collectionId }, incomingCards);
//     if (updateCardsResult.status === 'error') {
//       return respondWithError(res, 500, updateCardsResult.message, updateCardsResult.errorDetails);
//     }

//     res.status(200).json({
//       message: 'Cards in collection updated successfully',
//       data: updateCardsResult.data.cards,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// Function to add cards to a collection
