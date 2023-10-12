const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validatePassword, createToken } = require('../services/auth');
const mongoose = require('mongoose');
const Deck = require('../models/Deck');
const Collection = require('../models/Collection');
const winston = require('winston');
const { validationResult } = require('express-validator');
const { findUser } = require('../utils/utils');
const {
  convertPrice,
  filterUniqueCards,
  handleDuplicateYValuesInDatasets,
} = require('../utils/collectionUtils');
const ChartData = require('../models/ChartData');

const SECRET_KEY = process.env.SECRET_KEY;

// Utility function for error handling
const handleErrors = (res, error, next) => {
  winston.error('Error:', error);
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: 'Invalid user data', error: error.errors });
  }
  if (error.code === 11000) {
    return res.status(400).json({ message: 'Duplicate key error', error: error.keyValue });
  }
  next(error); // Only call next if you haven't responded yet
};

// Function to handle not found resources
const handleNotFound = (resource, res) => {
  return res.status(404).json({ message: `${resource} not found` });
};

// Function to handle server errors
const handleServerError = (error, message, res, next) => {
  winston.error(message, error);
  res.status(500).json({ error: message });
  next(error);
};

// Utility function for validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
};

// console.log('Debug SECRET_KEY in [UserController]: ', process.env.SECRET_KEY);

exports.signup = async (req, res, next) => {
  try {
    handleValidationErrors(req, res);

    const { login_data, basic_info, ...otherInfo } = req.body;
    const { username, password, email, role_data } = login_data;
    const { name } = basic_info;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const existingUser = await User.findOne({ 'login_data.username': username.trim() });
    if (existingUser) {
      return res.status(409).json({ message: `Username ${username} already exists` });
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

    const token = jwt.sign(
      {
        username: newUser.login_data.username,
        id: newUser._id,
        capabilities: newUser.login_data.role_data.capabilities,
      },
      SECRET_KEY,
    );

    res.status(201).json({ token });
  } catch (error) {
    handleErrors(res, error, next);
  }
};

exports.signin = async (req, res, next) => {
  console.log('req.body:', req.body);
  try {
    handleValidationErrors(req, res);
    // console.log('req.body:', req);
    const { username, password } = req.body;
    const user = await findUser(username);
    // console.log('req.body:', req.body);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    const valid = await validatePassword(password, user.login_data.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = createToken({
      username: user.login_data.username,
      id: user._id,
      capabilities: user.capabilities,
    });

    return res.json({ token });
  } catch (error) {
    handleErrors(res, error, next);
  }
};

exports.getProfile = async (req, res, next) => {
  // console.log('req.authData:', req.authData);
  const user = await User.findById(req.authData.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
};

exports.updateProfile = async (req, res, next) => {
  const updates = req.body;

  try {
    const user = await User.findByIdAndUpdate(req.authData.id, updates, {
      new: true,
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Update error: ', error);
    next(error);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.authData.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete error: ', error);
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found.');
    res.json(user);
  } catch (error) {
    console.error('Get by ID error: ', error);
    next(error);
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

// Update existing deck
exports.updateAndSyncDeck = async (req, res, next) => {
  const { userId, deckId } = req.params;
  const { cards, description, name, totalPrice } = req.body;

  // console.log('UPDATING userId:', userId);
  // console.log('UPDATING deckId:', deckId);
  // console.log('UPDATING cards:', cards);
  // console.log('UPDATING description:', description);
  // console.log('UPDATING name:', name);
  // console.log('req.body:', req.body);

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

    // console.log('Updated Deck Data:', updatedDeck); // NEW LINE
    // console.log('Updated Name:', updatedDeck.name); // NEW LINE
    // console.log('Updated Description:', updatedDeck.description); // NEW LINE
    // console.log('Updated Cards:', updatedDeck.cards); // NEW LINE
    // console.log('Updated Total Price:', updatedDeck.totalPrice); // NEW LINE

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
  const { userId } = req.params;
  const {
    cards,
    description,
    name,
    totalPrice,
    chartData,
    totalCost,
    allCardPrices,
    quantity,
    totalQuantity,
  } = req.body;

  try {
    let chartDataObj = new ChartData(chartData);
    await chartDataObj.save();

    const newCollection = new Collection({
      userId,
      name,
      description,
      cards: cards || [],
      totalPrice: totalPrice || 0,
      totalCost: totalCost || '',
      allCardPrices: allCardPrices || [],
      quantity: quantity || 0,
      totalQuantity: totalQuantity || 0,
      chartData: chartDataObj._id,
    });

    const savedCollection = await newCollection.save();

    // Fetch the user by their userId
    const user = await User.findById(userId);
    if (!user) {
      return handleNotFound('User', res);
    }

    user.allCollections.push(savedCollection._id);
    await user.save();

    winston.info('New Collection Created:', savedCollection);
    res.status(201).json({ savedCollection });
  } catch (error) {
    handleServerError(error, 'Failed to create new collection or chart', res, next);
  }
};

exports.getAllCollectionsForUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('allCollections');
    if (!user) return handleNotFound('User', res);
    winston.info(`Fetched ${user.allCollections.length} collections for user ${userId}`);
    res.status(200).json(user.allCollections);
  } catch (error) {
    handleServerError(error, 'Error fetching all collections for user', res, next);
  }
};
exports.updateAndSyncCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  const { description, name, chartData, totalCost, quantity, cards, totalQuantity } = req.body;

  if (!collectionId) return res.status(400).json({ message: 'collectionId is required' });

  const filteredCards = filterUniqueCards(cards);
  filteredCards.forEach((card) => {
    card.chart_datasets = handleDuplicateYValuesInDatasets(card);
  });

  const incomingDataset = chartData?.datasets?.[chartData.datasets.length - 1];
  if (incomingDataset) {
    const yValue = parseFloat(incomingDataset?.data[0]?.xy?.y);
    if (isNaN(yValue)) {
      return res.status(400).json({ message: 'Invalid dataset provided' });
    } else {
      incomingDataset.data[0].xy.y = yValue;
    }
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingCollection = await Collection.findOne({ _id: collectionId, userId });
    if (!existingCollection) return res.status(404).json({ message: 'Collection not found' });

    const associatedChartData = await ChartData.findById(existingCollection.chartData);
    if (!associatedChartData)
      return res.status(404).json({ message: 'ChartData not found for collection' });

    if (incomingDataset) {
      const yValuesSet = new Set(
        associatedChartData?.datasets?.map((dataset) => dataset.data[0].y),
      );
      if (yValuesSet.has(incomingDataset?.data[0]?.xy?.y)) {
        console.info('Duplicate y-data found. Skipping...');
      } else {
        associatedChartData.datasets.push(incomingDataset);
      }
      await associatedChartData.save();
    }
    existingCollection.cards = filteredCards;
    existingCollection.name = name;
    existingCollection.description = description;
    existingCollection.totalCost = totalCost;
    existingCollection.quantity = quantity;
    existingCollection.totalQuantity = totalQuantity;

    await existingCollection.save();

    res.status(200).json({ updatedCollection: existingCollection });
  } catch (error) {
    console.error('Failed to update collection', error);
    res.status(500).json({ message: 'Internal server error' });
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
