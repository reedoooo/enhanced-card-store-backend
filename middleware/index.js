const express = require('express');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');

module.exports = function applyCustomMiddleware(app) {
  app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.json());
  app.use(
    cors({
      origin: ['http://localhost:3000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Error handling middleware
  app.use((err, req, res, next) => {
    // console.error(err.stack); // Log the stack trace of the error

    // Customize the status code and message depending on the type of the error
    let status = 500;
    let message = 'An unexpected error occurred';

    if (err.name === 'ValidationError') {
      status = 400;
      message = err.message;
    } else if (err.name === 'MongoError') {
      status = 400;
      message = 'There was a problem with the database operation';
    }

    res.status(status).json({ message });
  });
};
