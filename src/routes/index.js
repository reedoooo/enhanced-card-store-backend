const express = require('express');
const router = express.Router();

const userRoutes = require('./api/user');
const cardRoutes = require('./api/card');
const imageRoutes = require('./api/image');

router.use('/users', userRoutes);
router.use('/cards', cardRoutes);
router.use('/card-image', imageRoutes);

module.exports = router;
