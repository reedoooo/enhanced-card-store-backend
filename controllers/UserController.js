const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validatePassword, createToken } = require('../services/auth');
const mongoose = require('mongoose');
const Deck = require('../models/Deck');
const { Collection } = require('../models/Collection');
const winston = require('winston');
const { validationResult } = require('express-validator');
const { findUser } = require('../utils/utils');
const {
  convertPrice,
  filterUniqueCards,
  handleDuplicateYValuesInDatasets,
} = require('../utils/collectionUtils');

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
  next(error);
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
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return handleNotFound('User', res);
    }

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
      chartData: chartData || {},
    });

    const savedCollection = await newCollection.save();
    user.allCollections.push(savedCollection._id);
    await user.save();

    winston.info('New Collection Created:', savedCollection);
    res.status(201).json({ savedCollection }); // 201 status code for resource creation
  } catch (error) {
    winston.error('Failed to create new collection or chart:', error);
    res.status(500).json({ error: 'Failed to create new collection or chart' });
    next(error);
  }
};

exports.getAllCollectionsForUser = async (req, res, next) => {
  // Check if the request parameter 'userId' exists
  if (!req.params.userId) {
    // If not, return a 400 status with a message indicating the 'userId' is required
    return res.status(400).json({ message: 'userId is required' });
  }

  // Wrap code inside a try-catch block to handle any potential errors
  try {
    const user = await User.findById(req.params.userId).populate('allCollections');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Retrieve all collections associated with the user's 'allCollections' field from the database
    // let collections = await Collection.find({
    //   _id: { $in: user.allCollections },
    // });

    // This line is commented out but would print all collections to the console if uncommented
    // console.log('********************ALL COLLECTIONS********************', collections);

    // Log the number of collections fetched using the Winston logging library
    // winston.info(`Fetched ${collections.length} collections for user ${req.params.userId}`);
    winston.info(`Fetched ${user.allCollections.length} collections for user ${req.params.userId}`);

    // Send a 200 status and the collections in the response
    // res.status(200).json(collections);
    res.status(200).json(user.allCollections);
  } catch (error) {
    // If there's an error in the try block
    // Log the error using Winston
    winston.error(`Error fetching all collections for user: ${error}`);
    // Forward the error to the next middleware in the chain
    next(error);
  }
};

exports.updateAndSyncCollection = async (req, res, next) => {
  const { userId, collectionId } = req.params;
  let {
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

  // Convert all prices
  if (totalPrice) totalPrice = convertPrice(totalPrice);
  if (Array.isArray(allCardPrices)) allCardPrices = allCardPrices.map(convertPrice);

  if (!collectionId) return res.status(400).json({ message: 'collectionId is required' });

  // Filter out duplicates and handle dataset
  cards = filterUniqueCards(cards);
  cards.forEach((card) => {
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

  let updatedCollection;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingCollection = await Collection.findOne({ _id: collectionId, userId });
    if (!existingCollection) return res.status(404).json({ message: 'Collection not found' });

    if (incomingDataset) {
      if (existingCollection.chartData && Array.isArray(existingCollection.chartData.allXYValues)) {
        const yValuesSet = new Set(existingCollection?.chartData?.allXYValues?.map((xy) => xy.y));
        if (yValuesSet.has(incomingDataset?.data[0]?.xy?.y)) {
          winston.info('Duplicate y-data found. Skipping...');
        } else {
          existingCollection.chartData.datasets.push(incomingDataset);
          existingCollection.chartData.allXYValues.push(incomingDataset.data[0].xy);
        }
      } else {
        existingCollection.chartData = {
          datasets: [incomingDataset],
          allXYValues: [incomingDataset.data[0].xy],
        };
      }
    }

    existingCollection.cards = cards;
    existingCollection.name = name;
    existingCollection.description = description;
    existingCollection.totalCost = totalCost;
    existingCollection.totalPrice = totalPrice;
    existingCollection.quantity = quantity;
    existingCollection.totalQuantity = totalQuantity;
    existingCollection.allCardPrices = allCardPrices;

    await existingCollection.save();

    if (!user.allCollections.includes(existingCollection._id)) {
      user.allCollections.push(existingCollection._id);
      await user.save();
    }

    // Populate after the potential addition
    await user.populate('allCollections').execPopulate();
    res.status(200).json({ updatedCollection, allCollections: user.allCollections });

    // updatedCollection = existingCollection;
  } catch (error) {
    winston.error('Failed to update collection:', error);
    console.error('Error while updating collection:', error);
    return next(error);
  }

  // if (updatedCollection) {
  //   // winston.info('Updated Collection Data:', updatedCollection);
  //   // return res.status(200).json({ updatedCollection });
  //   return res.status(200).json({ updatedCollection, allCollections: user.allCollections });
  // } else {
  //   return res.status(404).json({ message: 'Failed to update the collection' });
  // }
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
