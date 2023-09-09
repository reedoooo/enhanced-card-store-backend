// utils.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET_KEY = process.env.SECRET_KEY;

const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

function createToken(payload) {
  console.log('Debug SECRET_KEY: ', process.env.SECRET_KEY); // Debug line
  return jwt.sign(payload, process.env.SECRET_KEY);
}

module.exports = {
  validatePassword,
  createToken,
};
