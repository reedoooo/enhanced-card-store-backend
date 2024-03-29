const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
let invalidRefreshTokens = new Set();

const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
async function fetchUserById(userId) {
  const user = await User.findById(userId).populate("userSecurityData");
  if (!user) throw new Error("User not found");
  return user;
}
function generateJWT(payload, secret, options) {
  return jwt.sign(payload, secret, options);
}
/**
 * Generates a JWT token for the user.
 * @param {object} userData - The user data to be used to generate the token.
 * @returns {string} - The generated token.
 * */
async function generateToken(userId, isRefreshToken = false) {
  try {
    const user = await User.findById(userId).populate("userSecurityData");
    if (!user) throw new Error("User not found");

    const payload = {
      userId: user._id,
      username: user.username, // Assuming username is directly under user
      role_data: user.userSecurityData.role_data,
    };

    if (!isRefreshToken) {
      payload.role_data = user.userSecurityData.role_data; // Only for access token
    }
    const options = { expiresIn: isRefreshToken ? "7d" : "1h" };
    const secret = isRefreshToken
      ? process.env.REFRESH_TOKEN_SECRET
      : process.env.SECRET_KEY;
    return generateJWT(payload, secret, options);
  } catch (error) {
    console.error("Error generating token:", error);
    throw error;
  }
}
async function saveToken(userId, token, isRefreshToken = false) {
  const user = await fetchUserById(userId);
  if (isRefreshToken) {
    user.userSecurityData.refreshToken = token;
  } else {
    user.userSecurityData.accessToken = token;
  }
  await user.save();
}
async function saveTokens(userId, accessToken, refreshToken) {
  await saveToken(userId, accessToken, false); // false for access token
  await saveToken(userId, refreshToken, true); // true for refresh token
  return { savedAccessToken: accessToken, savedRefreshToken: refreshToken };
}
function invalidateToken(refreshToken) {
  invalidRefreshTokens.add(refreshToken);
}
function isRefreshTokenValid(refreshToken) {
  return !invalidRefreshTokens.has(refreshToken);
}
module.exports = {
  validatePassword,
  generateToken: (userId) => generateToken(userId, false), // false for access token
  generateRefreshToken: (userId) => generateToken(userId, true), // true for refresh token
  saveRefreshToken: (userId, refreshToken) =>
    saveToken(userId, refreshToken, true),
  saveAccessToken: (userId, accessToken) =>
    saveToken(userId, accessToken, false),
  saveTokens,
  invalidateToken,
  isRefreshTokenValid,
};
