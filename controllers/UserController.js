const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  findUser,
  validatePassword,
  createToken,
} = require('../services/auth.js');
const mongoose = require('mongoose');
const Deck = require('../models/Deck');

const SECRET_KEY = process.env.SECRET_KEY;
console.log('Debug SECRET_KEY in [UserController]: ', process.env.SECRET_KEY);

exports.signup = async (req, res, next) => {
  // console.log('signup', req.body);

  const { login_data, basic_info, ...otherInfo } = req.body;
  // console.log('login_data', login_data);

  const { username, password, email, role_data } = login_data;
  // console.log('username: ', username);

  const { name } = basic_info;

  if (!name || !email || !username || !password) {
    return res.status(400).json({
      message: 'Basic_info, username, email, and password fields are required',
    });
  }

  const existingUser = await User.findOne({
    'login_data.username': username.trim(),
  });

  console.log('existingUser:', existingUser);
  if (existingUser) {
    return res
      .status(409)
      .json({ message: `Username ${username} already exists` });
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
  // console.log('newUser:', newUser);
  try {
    await newUser.save();
    const token = jwt.sign(
      {
        username: newUser.login_data.username,
        id: newUser._id,
        capabilities: newUser.login_data.role_data.capabilities,
      },
      SECRET_KEY,
    );
    // console.log('token:', token);
    res.status(201).json({ token });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.error('Signup validation error: ', error.errors);
      return res
        .status(400)
        .json({ message: 'Invalid user data', error: error.errors });
    } else if (error.code === 11000) {
      console.error('Duplicate key signup error: ', error.keyValue);
      return res
        .status(400)
        .json({ message: 'Duplicate key error', error: error.keyValue });
    }
    console.error('Signup error: ', error);
    next(error);
  }
};

exports.signin = async (req, res, next) => {
  // console.log('signin', req.body);
  const { username, password } = req.body;

  const user = await findUser(username);
  // console.log('user:', user);
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
      return res.status(404).json({ message: 'User not found' });
    }

    // Assuming user model has a field called 'allDecks' that stores an array of deck IDs
    let decks = await Deck.find({
      _id: { $in: user.allDecks },
    });

    // If no decks are found, create a new default deck for the user
    if (!decks || decks.length === 0) {
      const newDeck = new Deck({
        userId: user._id,
        name: 'Default Deck',
        description: 'This is your default deck.',
        cards: [],
      });

      await newDeck.save();

      // Add this new deck to the user's allDecks array (if you have such a field)
      user.allDecks.push(newDeck._id);
      await user.save();

      // We should set decks to the newDeck wrapped in an array to prevent the loop
      decks = [newDeck];
    }

    console.log('DECKS IN USERS:', decks);
    res.json(decks);
  } catch (error) {
    console.error('Error fetching all decks for user:', error);
    next(error);
  }
};

// Update existing deck
exports.updateAndSyncDeck = async (req, res, next) => {
  const { userId } = req.params;
  const { cards, deckId, description, name } = req.body;

  console.log('UPDATING userId:', userId);
  console.log('UPDATING deckId:', deckId);
  console.log('UPDATING cards:', cards);
  console.log('UPDATING description:', description);
  console.log('UPDATING name:', name);
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

    console.log('New Deck Created:', newDeck); // NEW LINE
    console.log('New Deck Name:', newDeck.name); // NEW LINE
    console.log('New Deck Description:', newDeck.description); // NEW LINE

    res.send(newDeck);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to create new deck' });
  }
};

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
