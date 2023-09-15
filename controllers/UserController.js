const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUser, validatePassword, createToken } = require('../services/auth');
const mongoose = require('mongoose');
const Deck = require('../models/Deck');
const Collection = require('../models/Collection');
const winston = require('winston');
const { validationResult } = require('express-validator');

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
  try {
    handleValidationErrors(req, res);

    const { username, password } = req.body;
    const user = await findUser(username);
    console.log('req.body:', req.body);
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
  console.log('req.authData:', req.authData);
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
  const { userId } = req.params;
  const { cards, deckId, description, name } = req.body;

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
      { $set: { cards, name, description } },
      { new: true },
    );

    if (!updatedDeck) {
      return res.status(404).send({ error: 'Deck not found' });
    }

    console.log('Updated Deck Data:', updatedDeck); // NEW LINE
    console.log('Updated Name:', updatedDeck.name); // NEW LINE
    console.log('Updated Description:', updatedDeck.description); // NEW LINE

    res.send(updatedDeck);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to update deck' });
  }
};

exports.createNewDeck = async (req, res, next) => {
  const { userId } = req.params;
  const { name, description, cards } = req.body;

  try {
    const newDeck = new Deck({ userId, name, description, cards });
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

// Get all collections for a specific user
// Get all collections for a specific user
exports.getAllCollectionsForUser = async (req, res, next) => {
  // Validation check
  if (!req.params.userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let collections = await Collection.find({
      _id: { $in: user.allCollections },
    });

    // More robust logging using Winston
    winston.info(`Fetched ${collections.length} collections for user ${req.params.userId}`);

    res.status(200).json(collections);
  } catch (error) {
    winston.error(`Error fetching all collections for user: ${error}`);
    next(error);
  }
};

// Update existing collection
exports.updateAndSyncCollection = async (req, res, next) => {
  // Perform validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  console.log('req.body:', req.body);
  const { userId, collectionId } = req.params;
  const { cards, description, name } = req.body;
  console.log('COLLECTION ID:', collectionId);
  try {
    const updatedCollection = await Collection.findOneAndUpdate(
      { _id: collectionId, userId },
      { $set: { cards, name, description } },
      { new: true },
    );

    if (!updatedCollection) {
      return res.status(404).send({ error: 'Collection not found' });
    }

    console.log('Updated Collection Data:', updatedCollection); // NEW LINE
    console.log('Updated Collection Name:', updatedCollection.name); // NEW LINE
    console.log('Updated Collection Description:', updatedCollection.description); // NEW LINE

    winston.info('Updated Collection Data:', updatedCollection);
    res.status(200).send(updatedCollection);
  } catch (error) {
    winston.error('Failed to update collection:', error);
    next(error);
  }
};

// Create a new collection
exports.createNewCollection = async (req, res, next) => {
  // Perform validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.params;
  const { name, description, cards } = req.body;

  try {
    const newCollection = new Collection({ userId, name, description, cards });
    await newCollection.save();

    winston.info('New Collection Created:', newCollection);
    res.status(201).send(newCollection); // 201 status code for resource creation
  } catch (error) {
    winston.error('Failed to create new collection:', error);
    res.status(500).send({ error: 'Failed to create new collection' });
    next(error);
  }
};

// exports.getAllCollectionsForUser = async (req, res, next) => {
//   try {
//     const userId = req.params.userId;
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     let collections = await Collection.find({
//       _id: { $in: user.allCollections },
//     });

//     if (!collections || collections.length === 0) {
//       const newCollection = new Collection({
//         userId: user._id,
//         name: 'Default Collection',
//         description: 'This is your default collection.',
//         cards: [],
//       });

//       await newCollection.save();
//       user.allCollections.push(newCollection._id);
//       await user.save();
//       collections = [newCollection];
//     }

//     res.json(collections);
//   } catch (error) {
//     console.error(`Error fetching collections for user ID ${req.params.userId}:`, error);
//     next(error);
//   }
// };

// // Update a specific collection
// exports.updateAndSyncCollection = async (req, res, next) => {
//   try {
//     const { collectionId } = req.params;
//     const updatedFields = req.body;

//     const updatedCollection = await Collection.findByIdAndUpdate(collectionId, updatedFields, {
//       new: true,
//     });

//     if (!updatedCollection) {
//       return res.status(404).json({ error: 'Collection not found' });
//     }

//     res.status(200).json(updatedCollection);
//   } catch (error) {
//     console.error(`Error updating collection ID ${req.params.collectionId}:`, error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// // Create a new collection
// exports.createNewCollection = async (req, res, next) => {
//   try {
//     const { userId, name, description, cards } = req.body;
//     const newCollection = new Collection({ userId, name, description, cards });

//     await newCollection.save();
//     res.status(201).json(newCollection);
//   } catch (error) {
//     console.error('Error creating new collection:', error);
//     res.status(500).json({ error: 'Failed to create new collection' });
//   }
// };

// // Get all decks for a user
// router.get('/api/users/:userId/decks', async (req, res) => {
//   const { userId } = req.params;
//   try {
//     const decks = await Deck.find({ userId });
//     res.send(decks);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: 'Failed to fetch decks' });
//   }
// });
