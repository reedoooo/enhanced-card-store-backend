const express = require('express');
const router = express.Router();

const userRoutes = require('./api/user');
const cardRoutes = require('./api/card');

router.use('/users', userRoutes);
router.use('/cards', cardRoutes);

module.exports = router;
