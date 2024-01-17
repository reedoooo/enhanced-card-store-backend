// services.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const SECRET_KEY = process.env.SECRET_KEY;
let invalidRefreshTokens = new Set();

const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// const createToken = (payload) => {
//   return jwt.sign(payload, process.env.SECRET_KEY);
// };

/**
 * Generates a JWT token for the user.
 * @param {object} userData - The user data to be used to generate the token.
 * @returns {string} - The generated token.
 * */
async function generateToken(userId) {
  try {
    const user = await User.findById(userId).populate('userSecurityData');
    if (!user) throw new Error('User not found');

    const payload = {
      userId: user._id,
      // Include only necessary data in the token payload
      username: user.username, // Assuming username is directly under user
      role_data: user.userSecurityData.role_data,
    };

    const options = { expiresIn: '1h' };
    return jwt.sign(payload, process.env.SECRET_KEY, options);
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
}

async function generateRefreshToken(userId) {
  try {
    const user = await User.findById(userId).populate('userSecurityData');
    if (!user) throw new Error('User not found');

    const payload = {
      userId: user._id,
      username: user.username, // Assuming username is directly under user
    }; // Simplified payload for refresh token

    const options = { expiresIn: '7d' };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, options);
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw error;
  }
}

async function saveRefreshToken(userId, refreshToken) {
  try {
    // Find the user first
    const user = await User.findById(userId).populate('userSecurityData');
    if (!user) throw new Error('User not found');

    // Update the refreshToken in the userSecurityData subdocument
    user.userSecurityData.refreshToken = refreshToken;
    await user.save();
  } catch (error) {
    console.error('Error saving refresh token:', error);
    throw error;
  }
}

async function saveAccessToken(userId, accessToken) {
  try {
    // Find the user first
    const user = await User.findById(userId).populate('userSecurityData');
    if (!user) throw new Error('User not found');

    // Update the refreshToken in the userSecurityData subdocument
    user.userSecurityData.accessToken = accessToken;
    await user.save();
  } catch (error) {
    console.error('Error saving access token:', error);
    throw error;
  }
}

async function saveTokens(userId, accessToken, refreshToken) {
  try {
    const user = await User.findById(userId).populate('userSecurityData');
    if (!user) throw new Error('User not found');

    // Assuming accessToken and refreshToken are to be stored in userSecurityData
    user.userSecurityData.accessToken = accessToken;
    user.userSecurityData.refreshToken = refreshToken;
    await user.save();

    return { savedAccessToken: accessToken, savedRefreshToken: refreshToken };
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
}

async function updateRefreshToken(userId, newRefreshToken) {
  try {
    // Find the user first
    const user = await User.findById(userId).populate('userSecurityData');
    if (!user) throw new Error('User not found');

    // Update the refreshToken in the userSecurityData subdocument
    user.userSecurityData.refreshToken = newRefreshToken;
    await user.save();
  } catch (error) {
    console.error('Error updating refresh token:', error);
    throw error;
  }
}

function invalidateToken(refreshToken) {
  invalidRefreshTokens.add(refreshToken);
}

function isRefreshTokenValid(refreshToken) {
  return !invalidRefreshTokens.has(refreshToken);
}

module.exports = {
  validatePassword,
  generateToken,
  generateRefreshToken,
  saveRefreshToken,
  updateRefreshToken,
  invalidateToken,
  isRefreshTokenValid,
  saveTokens,
};
