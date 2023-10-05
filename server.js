'use strict';

// Dependencies
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');
const { initSocket } = require('./socket');
const { setupSocketEvents } = require('./socketEvents');
const routes = require('./routes/index');

// Configuration
dotenv.config();
const port = process.env.PORT || 3001;

// Middleware and Routes
const applyCustomMiddleware = require('./middleware/index');

// App and Server Initialization
const app = express();
const server = http.createServer(app);
const cors = require('cors');
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// Socket Initialization
initSocket(server);
setupSocketEvents();

// Middleware Application
app.use(cookieParser());
applyCustomMiddleware(app, server);

// Routes
app.use('/api', routes);
app.use('/other', routes); // Review if this is necessary
app.get('/', (req, res) => res.send('This is the beginning....'));
app.get('/test', (req, res) => res.send('This is the test....'));

// Start the server
server.listen(port, () => console.log(`Server is up on port ${port}`));

module.exports = { app };
