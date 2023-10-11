// services.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const createToken = (payload) => {
  return jwt.sign(payload, process.env.SECRET_KEY);
};

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  console.log('Bearer Header:', bearerHeader);

  if (!bearerHeader) {
    return res.status(403).send({ message: 'No token provided' });
  }

  const token = bearerHeader.split(' ')[1];

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized!' });
    }

    req.authData = decoded;
    next();
  });
};

module.exports = {
  verifyToken,
  validatePassword,
  createToken,
};
