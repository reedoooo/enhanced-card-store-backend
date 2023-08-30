'use strict';

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import custom middleware and routes
const applyCustomMiddleware = require('./middleware');
const routes = require('./routes');

// Configure dotenv
dotenv.config();

// Prepare the express app with singleton
const app = express();
const port = process.env.PORT || 3001;

//MongoDb connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

app.use(cors()); // add this line if you haven't already
applyCustomMiddleware(app);
app.use(cookieParser());

// HANDLE ROUTES
app.use(
  '/api',
  (req, res, next) => {
    // console.log(`Received request on API route: ${req.method} ${req.originalUrl}`);
    next();
  },
  routes
);

app.get('/', (req, res) => {
  res.send('This is the beginning....');
});

app.get('/test', (req, res) => {
  res.send('This is the test....');
});

//start the server
app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

module.exports = app;
