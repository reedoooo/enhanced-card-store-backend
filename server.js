'use strict';

// Dependencies
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');
const socket = require('./socket'); // Socket module
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
socket.init(server); // Socket Initialization

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log(err));

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
server.listen(port, () => console.log(`Server is up on port ${port}`));

// Exports
module.exports = { app }; // Just exporting app as socket is initialized at startup
