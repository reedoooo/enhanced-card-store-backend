const bcrypt = require('bcrypt');
const { response } = require('express');

const Deck = require('../models/Deck');
const Collection = require('../models/Collection');
const User = require('../models/User');
const CardInCollection = require('../models/CardInCollection');

const CustomError = require('../middleware/customError');
const { STATUS, MESSAGES, ERROR_TYPES } = require('../constants');
const { logToAllSpecializedLoggers } = require('../middleware/infoLogger');
const {
  respondWithError,
  handleValidationErrors,
  extractData,
  logInfo,
  generateToken,
  createCollectionObject,
} = require('../utils/utils');
const { logError, logData } = require('../utils/loggingUtils');
const cardController = require('./CardController');

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

// User Profile Routes
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.authData.id);
    if (!user) {
      throw new CustomError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
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
      throw new CustomError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
    }

    response.status(200).json({
      message: 'Profile deleted successfully',
      data: user,
    });
  } catch (error) {
    console.error('Delete Profile Error: ', error);
    logError('Delete Profile Error: ', error);
    next(error);
  }
};
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new CustomError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
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

// User Deck Routes
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
    // console.log('CARDS', cards);

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

// User Collection: cards in collection routes
exports.addCardsToCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards } = req.body;

  // console.log('CARDS', cards);
  if (!Array.isArray(cards)) {
    // return res.status(400).json({ message: 'Invalid card data, expected an array' });
    throw new CustomError('Invalid card data, expected an array', 400);
  }

  try {
    const updateResult = await cardController.updateExistingCardInUserCollection(
      userId,
      collectionId,
      cards,
    );
    res.status(200).json(updateResult);
  } catch (error) {
    console.error('Error adding cards to collection:', error);
    logError('Error adding cards to collection:', error);
    // res.status(500).json({ message: 'Error adding cards to collection' });
    next(error);
  }
};
exports.removeCardsFromCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cardIds } = req.body;

  if (!Array.isArray(cardIds)) {
    // return res.status(400).json({ message: 'Invalid card IDs' });
    throw new CustomError('Invalid card IDs', 400);
  }

  try {
    // Removing cards from the collection
    const updateResult = await cardController.removeCardsFromUserCollection(
      userId,
      collectionId,
      cardIds,
    );
    res.status(200).json(updateResult);
  } catch (error) {
    console.error('Error removing cards from collection:', error);
    // res.status(500).json({ message: 'Error removing cards from collection' });
    next(error);
  }
};
exports.updateCardsInCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards, cardIds } = req.body;

  if (!Array.isArray(cards)) {
    // return res.status(400).json({ message: 'Invalid card data, expected an array' });
    throw new CustomError('Invalid card data, expected an array', 400);
  }

  try {
    const updateResult = await cardController.updateExistingCardInUserCollection(
      userId,
      collectionId,
      cards,
    );
    res.status(200).json(updateResult);
  } catch (error) {
    console.error('Error updating cards in collection:', error);
    logError('Error updating cards in collection:', error);
    // res.status(500).json({ message: 'Error updating cards in collection' });
    next(error);
  }
};

// User Collection: chart data in collection routes
exports.updateChartDataInCollection = async (req, res, next) => {
  try {
    const { collectionId, userId } = req.params;
    const updatedChartData = req.body.allXYValues;
    const user = await User.findById(userId).populate('allCollections');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    collection.chartData.allXYValues = updatedChartData; // Merge or replace the chart data
    await collection.save();

    await user.populate('allCollections');
    // logData('Updated chart data', { collectionId, updatedChartData });
    return res.status(200).json({
      chartMessage: 'Chart data updated successfully',
      allXYValues: collection.chartData.allXYValues,
    });
  } catch (error) {
    console.error('Error updating cards in updateChartDataInCollection:', error);
    respondWithError(res, 500, 'Error updating cards in updateChartDataInCollection', error);
    logError('Error fetching collections', error.message, null, { error });
    next(error);
  }
};
// User Collection: custom fields in collection routes
exports.getAllCollectionsForUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    console.log('USER ID --------', userId);
    const user = await User.findById(userId).populate({
      path: 'allCollections',
      populate: { path: 'cards' }, // This line populates the 'cards' field within each collection
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Re-populate the 'cards' field for each collection
    user.allCollections = await Promise.all(
      user.allCollections.map(async (collection) => {
        return await Collection.findById(collection._id).populate('cards');
      }),
    );

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

    // Fetch the 'Dark Magician Girl' card using the cardController
    const darkMagicianGirlSearchResults =
      await cardController.fetchAndTransformCardData('Dark Magician Girl');
    const darkMagicianGirl = darkMagicianGirlSearchResults[0];

    // Set initial quantity and totalPrice for the card
    darkMagicianGirl.quantity = 1;
    darkMagicianGirl.totalPrice = darkMagicianGirl.price * darkMagicianGirl.quantity;

    const darkMagicianGirlCard = new CardInCollection(darkMagicianGirl);
    await darkMagicianGirlCard.save();

    // Create new collection data
    const newCollectionData = createCollectionObject(req.body, userId);
    const newCollection = new Collection(newCollectionData);

    // Add card's _id to the collection
    newCollection.cards.push(darkMagicianGirlCard._id);

    // Update collection's quantity and totalPrice
    newCollection.totalQuantity = 1; // As there's only one card
    newCollection.quantity = 1; // As there's only one card
    newCollection.totalPrice = darkMagicianGirlCard.totalPrice; // Total price of the collection is the price of the single card

    await newCollection.save();

    // Add new collection to user's allCollections
    user.allCollections.push(newCollection._id);
    await user.save();

    logInfo('createNewCollection', { newCollection });

    // Populate allCollections and cards
    const populatedUser = await User.findById(userId).populate({
      path: 'allCollections',
      populate: { path: 'cards' },
    });

    const populatedNewCollection = populatedUser.allCollections.find((collection) =>
      collection._id.equals(newCollection._id),
    );

    res.status(201).json({
      message: 'New collection created successfully',
      data: populatedNewCollection,
    });
  } catch (error) {
    logError('Error in createNewCollection', error);
    next(error);
  }
};
exports.updateAndSyncCollection = async (req, res, next) => {
  const { collectionId, userId } = req.params;
  const updatedCollectionData = req.body.updatedCollection;

  try {
    // Find the user and the specific collection within allCollections
    const user = await User.findById(userId).populate({
      path: 'allCollections',
      populate: { path: 'cards' },
    });

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Find the specific collection
    const collection = user.allCollections.find((coll) => coll._id.toString() === collectionId);
    if (!collection) {
      throw new CustomError('Collection not found', 404);
    }

    // Update the collection with new data
    for (const key in updatedCollectionData) {
      if (Object.prototype.hasOwnProperty.call(updatedCollectionData, key)) {
        collection[key] = updatedCollectionData[key];
      }
    }

    await collection.save();

    // Update user document by setting the ObjectId of the updated collection
    user.allCollections = user.allCollections.map((coll) =>
      coll._id.toString() === collectionId ? collection._id : coll,
    );

    await user.save();

    return res.status(200).json({
      message: 'Collection updated successfully',
      collectionData: collection,
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    next(error);
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
