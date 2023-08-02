const express = require('express');
const router = express.Router();

const { verifyToken } = require('../../services/auth.js');
const UserController = require('../../controllers/UserController.js');

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // console.error(`Error occurred in ${req.path}: `, error);
      next(error);
    });
  };
}

router.post('/signup', asyncHandler(UserController.signup));

router.post('/signin', asyncHandler(UserController.signin));

router.get('/profile', verifyToken, asyncHandler(UserController.getProfile));

router.put('/profile/:id', verifyToken, asyncHandler(UserController.updateProfile));

router.delete('/profile/:id', verifyToken, asyncHandler(UserController.deleteProfile));

router.get('/:id', asyncHandler(UserController.getUserById));

router.use((error, req, res, next) => {
  // console.error('Middleware error: ', error);
  res.status(500).send('Server error.');
});

module.exports = router;
