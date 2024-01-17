// Require
const jwt = require('jsonwebtoken');
const checkToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        // Token is not valid
        return res.status(401).json({ message: 'Invalid token', error: err.message });
      }

      // Token is valid
      res.status(200).json({ message: 'Token is valid', data: decoded.userId });
    });
  } catch (error) {
    console.error('Token Check Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
    next(error);
  }
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

// USER DATA ROUTES (GET)
module.exports = {
  verifyToken,
  checkToken,
};
