// utils.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET_KEY = process.env.SECRET_KEY;

const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const createToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY);
};

module.exports = {
  validatePassword,
  createToken,
};
