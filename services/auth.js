// services.js
const Users = require('../models/User');
const jwt = require('jsonwebtoken');
const { validatePassword, createToken } = require('../utils/utils');
const SECRET_KEY = process.env.SECRET_KEY;

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  console.log('Bearer Header:', bearerHeader);

  if (!bearerHeader) {
    return res.status(403).send({ message: 'No token provided' });
  }

  // Split at the space
  const bearer = bearerHeader.split(' ');
  // Get token from array
  const token = bearer[1];
  console.log('Debug SECRET_KEY in [auth]: ', process.env.SECRET_KEY);

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized!' });
    }

    req.authData = decoded;
    next();
  });
};

const findUser = async (username) => {
  return await Users.findOne({ 'login_data.username': username });
};

module.exports = {
  verifyToken,
  findUser,
  validatePassword,
  createToken,
};
