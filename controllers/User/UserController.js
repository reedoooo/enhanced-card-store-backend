const bcrypt = require('bcrypt');
const { response } = require('express');

const Deck = require('../../models/Deck');
const Collection = require('../../models/Collection');
const User = require('../../models/User');
const CardInCollection = require('../../models/CardInCollection');
const Cart = require('../../models/Cart');

const CustomError = require('../../middleware/customError');
const { logError, logInfo } = require('../../utils/loggingUtils');

const { STATUS, MESSAGES, ERROR_TYPES } = require('../../constants');
const { logToSpecializedLogger } = require('../../middleware/infoLogger');
const {
  handleValidationErrors,
  extractData,
  generateToken,
  createCollectionObject,
  filterDailyCollectionPriceHistory,
  filterUniqueYValues,
} = require('../../utils/utils');
const cardController = require('../Cards/CardController');
// !--------------------------! USERS !--------------------------!
// USER ROUTES: SIGNUP / SIGNIN
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
        role_data: role_data || {},
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
    logError('Signup Error: ', error.message, null, { error });
    next(error);
  }
};
exports.signin = async (req, res, next) => {
  try {
    handleValidationErrors(req, res);

    const { username, password } = req.body;

    if (!process.env.SECRET_KEY) {
      logToSpecializedLogger('info', { section: 'signin' });
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
    logError('Signin Error: ', error.message, null, { error });
    // Use headersSent to check if headers are already sent to the client
    if (!res.headersSent) {
      next(error);
    }
  }
};
// USER PROFILE ROUTES (GET, UPDATE, DELETE)
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
    logError('Get User By ID Error: ', error, null, { error });
    next(error);
  }
};
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.authData.id);
    if (!user) {
      throw new CustomError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
    }

    res.status(200).json({
      message: 'Fetched user data successfully',
      data: user,
    });
  } catch (error) {
    console.error('Get Profile Error: ', error);
    logError('Get Profile Error: ', error, null, { error });
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
    logError('Update Profile Error: ', error, null, { error });
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
    logError('Delete Profile Error: ', error, null, { error });
    next(error);
  }
};
// !--------------------------! DECKS !--------------------------!
// DECK ROUTES (GET, CREATE, UPDATE, DELETE)
exports.getAllDecksForUser = async (req, res, next) => {
  const userId = req.params.userId; // Already validated by middleware

  if (!userId) {
    return next(new CustomError('User ID is required', 400));
  }

  try {
    // Fetch user and populate allDecks with cards
    const user = await User.findById(userId).populate({
      path: 'allDecks',
      populate: { path: 'cards' },
    });

    if (!user) {
      logError('User not found', new Error(MESSAGES.USER_NOT_FOUND));
      throw new CustomError(MESSAGES.USER_NOT_FOUND, STATUS.NOT_FOUND);
    }

    // Check if user has no decks and create a default one if necessary
    if (user.allDecks.length === 0) {
      const newDeck = new Deck({
        userId: user._id,
        name: 'Default Deck',
        description: 'This is your default deck.',
        cards: [],
      });

      await newDeck.save();
      user.allDecks.push(newDeck);
      await user.save();
    }

    // Note: user.allDecks is already populated with cards at this point
    res.status(200).json({
      message: 'Fetched all decks successfully',
      data: user.allDecks,
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    logError('Error fetching decks:', error);
    next(error); // Let the unified error handler deal with it
  }
};
exports.updateAndSyncDeck = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const deckId = req.params.deckId;
    const updatedDeckData = req.body;

    // Validate the incoming data
    if (!userId || !updatedDeckData) {
      return res.status(400).json({ message: 'Invalid request data.' });
    }

    // Fetch the user
    const user = await User.findById(userId).populate('allDecks');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if updatedDeckData is an array (all decks) or a single object (one deck)
    if (Array.isArray(updatedDeckData)) {
      // Update all decks
      user.allDecks = updatedDeckData; // Assuming updatedDeckData contains all updated deck objects
    } else {
      // Update a single deck
      if (!deckId) {
        return res.status(400).json({ message: 'Deck ID is required for updating a single deck.' });
      }

      const deck = user.allDecks.find((deck) => deck.id === deckId);
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found.' });
      }

      // Update the deck with new data
      for (const key in updatedDeckData) {
        if (Object.prototype.hasOwnProperty.call(updatedDeckData, key)) {
          deck[key] = updatedDeckData[key];
        }
      }
    }

    // Save the updated user and its decks
    await user.save();
    await user.populate({ path: 'allDecks', populate: { path: 'cards' } });

    res.status(200).json({ message: 'Deck updated successfully.', allDecks: user.allDecks });
  } catch (error) {
    next(error);
  }
};
exports.updateDeckDetails = async (req, res, next) => {
  try {
    const { userId, deckId } = req.params;
    const { name, description, tags, color } = req.body;

    // Validate the incoming data
    if (!userId || !deckId || !name || !description) {
      return res.status(400).json({ message: 'Invalid request data.', reqBody: req.body });
    }

    // Fetch the user and the deck and update the deck with new data
    let user = await User.findById(userId).populate('allDecks');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const deck = user?.allDecks?.find((deck) => deck.id === deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found.' });
    }

    deck.name = name;
    deck.description = description;
    deck.tags = tags;
    deck.color = color;

    // Save the updated user
    await user.save();

    // Re-fetch and populate user's allDecks
    await user.populate({ path: 'allDecks', populate: { path: 'cards' } });

    res.status(200).json({ message: 'Deck updated successfully.', allDecks: user.allDecks });
  } catch (error) {
    console.error('Error updating deck details:', error);
    next(error);
  }
};
exports.createNewDeck = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, description, tags, color, cards, totalPrice } = req.body;
    const user = await User.findById(req.params.userId).populate('allDecks');

    console.log('Request body:', req.body);
    const newDeck = new Deck({ userId, name, description, tags, color, cards, totalPrice });
    await newDeck.save();

    user.allDecks.push(newDeck._id);
    await user.save();

    // Populate user's allDecks
    await user.populate({ path: 'allDecks', populate: { path: 'cards' } });

    res.status(201).json({
      message: 'New deck created successfully',
      data: newDeck,
    });
  } catch (error) {
    next(error);
  }
};
exports.deleteDeck = async (req, res, next) => {
  try {
    const { userId, deckId } = req.params;

    // Find user by userId
    const user = await User.findById(userId).populate('allDecks');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the deck within the user's decks and remove it
    const deckIndex = user?.allDecks?.findIndex((d) => d._id.toString() === deckId);
    if (deckIndex === -1) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    user?.allDecks?.splice(deckIndex, 1);
    await user.save();

    res
      .status(200) // OK
      .json({ message: 'Deck deleted successfully', deletedDeckId: deckId });
  } catch (error) {
    console.error('Error deleting deck:', error);
    next(error);
  }
};
// DECK ROUTES: CARDS-IN-DECKS ROUTES (GET, ADD, REMOVE, UPDATE)
exports.addCardsToDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards } = req.body;
  if (!Array.isArray(cards)) {
    throw new CustomError('Invalid card data, expected an array', 400);
  }

  try {
    const updateResult = await cardController.addCardToUserDeck(userId, deckId, cards);
    console.log('UPDATE RESULT +++++++++++++++', updateResult);
    res.status(200).json(updateResult);
  } catch (error) {
    console.error('Error adding cards to deck:', error);
    logError('Error adding cards to deck:', error, null, { error });
    next(error);
  }
};
exports.removeCardsFromDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards } = req.body;

  if (!Array.isArray(cards)) {
    throw new CustomError('Invalid card IDs', 400, true, {
      cards,
    });
  }

  try {
    const updateResult = await cardController.removeCardsFromUserDeck(userId, deckId, cards);
    console.log('UPDATE RESULT +++++++++++++++', updateResult);
    res.status(200).json(updateResult);
  } catch (error) {
    console.error('Error removing cards from deck:', error);
    next(error);
  }
};
exports.updateCardsInDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards } = req.body;

  if (!Array.isArray(cards)) {
    throw new CustomError('Invalid card data, expected an array', 400);
  }

  try {
    const updateResult = await cardController.updateExistingCardInUserDeck(userId, deckId, cards);
    res.status(200).json(updateResult);
  } catch (error) {
    console.error('Error updating cards in deck:', error);
    logError('Error updating cards in deck:', error);
    next(error);
  }
};
// !--------------------------! COLLECTIONS !--------------------------!
// COLLECTION ROUTES (GET, CREATE, UPDATE, DELETE)
exports.getAllCollectionsForUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    let user = await User.findById(userId).populate({
      path: 'allCollections',
      populate: { path: 'cards' },
    });

    if (!user) {
      console.error('User not found:', userId);
      return; // Or handle this scenario appropriately
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

    // Filter the dailyCollectionPriceHistory before saving
    const filteredDailyCollectionPriceHistory = await filterDailyCollectionPriceHistory(
      collection._id,
    );
    const filteredAllXYValues = await filterUniqueYValues(collection._id);

    // Update the collection with new data
    for (const key in updatedCollectionData) {
      if (Object.prototype.hasOwnProperty.call(updatedCollectionData, key)) {
        collection[key] = updatedCollectionData[key];
        // collection.dailyCollectionPriceHistory = filteredDailyCollectionPriceHistory;
      }
      collection.dailyCollectionPriceHistory = filteredDailyCollectionPriceHistory;
      collection.allXYValues = filteredAllXYValues;
    }

    // Save the updated collection
    await collection.save();

    // Repopulate the cards of the collection after update to ensure it's returned populated
    await collection.populate('cards');
    // Update user document by setting the ObjectId of the updated collection
    user.allCollections = user.allCollections.map((coll) =>
      coll._id.toString() === collectionId ? collection._id : coll,
    );

    await user.save();

    return res.status(200).json({
      message: 'Collection updated successfully',
      collectionData: collection, // This now includes populated cards
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

    user.allCollections?.splice(collectionIndex, 1);
    await user.save();

    res
      .status(200)
      .json({ message: 'Collection deleted successfully', deletedCollectionId: collectionId });
  } catch (error) {
    console.error('Error updating collection in deleteCollection:', error);
    logToSpecializedLogger('error', { section: 'deleteCollection' });
    next(error);
  }
};
// COLLECTION ROUTES: CHARTS-IN-COLLECTION ROUTES (UPDATE)
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
    return res.status(200).json({
      chartMessage: 'Chart data updated successfully',
      allXYValues: collection.chartData.allXYValues,
    });
  } catch (error) {
    console.error('Error updating cards in updateChartDataInCollection:', error);
    logError('Error fetching collections', error.message, null, { error });
    next(error);
  }
};
// COLLECTION ROUTES: CARDS-IN-COLLECTION Routes (GET, CREATE, UPDATE, DELETE)
exports.addCardsToCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { cards } = req.body;
  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array but got ' });
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
  const { cards } = req.body;
  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array but got ' });
  }

  try {
    // Removing cards from the collection
    const updateResult = await cardController.removeCardsFromUserCollection(
      userId,
      collectionId,
      cards,
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
  const { cards } = req.body;
  if (!Array.isArray(cards)) {
    return res.status(400).json({ message: 'Invalid card data, expected an array but got' });
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
// !--------------------------! CARTS !--------------------------!
// CART ROUTES (GET, CREATE, UPDATE)
exports.getUserCart = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('cart');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.cart) {
      const newCart = new Cart({ userId, totalPrice: 0, quantity: 0, items: [] });
      await newCart.save();
      user.cart = newCart._id;
      await user.save();
      return res.status(200).json(newCart);
    }
    return res.status(200).json(user.cart);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
exports.createEmptyCart = async (req, res, next) => {
  const { userId } = req.params;

  try {
    let cart = await Cart.findOne({ userId });
    if (cart) {
      return res.status(409).json({ error: 'A cart for this user already exists.' });
    }

    cart = new Cart({ userId, items: [] });
    await cart.save();
    return res.status(201).json(cart);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
exports.updateCart = async (req, res, next) => {
  const { userId, cartItems } = req.body;

  if (!Array.isArray(cartItems)) {
    return res.status(400).json({ error: 'Cart must be an array' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let currentCart = await Cart.findById(user.cart);
    if (!currentCart) {
      currentCart = new Cart({ userId: user._id, cart: [] });
    }

    let updatedCart = [...currentCart.cart];

    for (let item of cartItems) {
      const { id, quantity: newQuantity } = item;

      const existingItemIndex = updatedCart.findIndex(
        (cartItem) => cartItem.id.toString() === id.toString(),
      );

      if (existingItemIndex > -1) {
        if (newQuantity === 0) {
          updatedCart.splice(existingItemIndex, 1);
        } else {
          updatedCart[existingItemIndex].quantity = newQuantity;
          console.log('New value for existing item', updatedCart[existingItemIndex]);
        }
      } else if (newQuantity > 0) {
        updatedCart.push(item);
      }
    }

    currentCart.cart = updatedCart;

    await currentCart.save();

    await user.save();
    if (!user.cart) {
      user.cart = currentCart._id;
      await user.save();
    }

    res.json(currentCart);
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: 'Server error' });
    next(error);
  }
};
