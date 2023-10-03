'use strict';

// Dependencies
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');
const { initSocket } = require('./socket'); // Import socket initialization
const { setupSocketEvents } = require('./socketEvents'); // Import socket events setup
const winston = require('winston'); // Winston for logging
const cors = require('cors'); // CORS for cross-origin requests

// Middleware and Routes
const applyCustomMiddleware = require('./middleware');

// Configuration
dotenv.config();
const port = process.env.PORT || 3001;

// App and Server Initialization
const app = express();
app.use(cors()); // CORS for cross-origin requests
const server = http.createServer(app);
initSocket(server); // Socket Initialization

// Socket Event Setup
// Note: Ensure that this is called after `initSocket` and potentially after the DB is connected
// (or wherever in your logic flow makes the most sense for events to start being listened for/emitted)
setupSocketEvents();

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

// Middleware Application
app.use(cookieParser());
applyCustomMiddleware(app, server);

// Routes
const routes = require('./routes'); // Routes Import
app.use('/api', routes);
app.use('/other', routes); // Ensure that this is intentional and necessary
app.get('/', (req, res) => res.send('This is the beginning....'));
app.get('/test', (req, res) => res.send('This is the test....'));

// Server Start
server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

// Exports
module.exports = { app }; // Just exporting app as socket is initialized at startup
