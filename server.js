'use strict';

// Dependencies
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./socket');
const { setupSocketEvents } = require('./socketEvents');
const routes = require('./routes/index');

// Configuration
dotenv.config();
const port = process.env.PORT || 3001;

// App and Server Initialization
const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000', // or use an array of allowed origins if you have multiple
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
};

app.use(cors(corsOptions));

// Middleware and Routes
const applyCustomMiddleware = require('./middleware/index');

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// Socket Initialization
initSocket(server);
setupSocketEvents();

// Middleware Application
app.use(express.json()); // To parse JSON bodies
app.use(cookieParser());
applyCustomMiddleware(app, server);
// Routes
app.use('/api', routes);
app.get('/', (req, res) => res.send('This is the beginning....'));
app.get('/test', (req, res) => res.send('This is the test....'));

// Error Handling Middleware
// const unifiedErrorHandler = require('./middleware/unifiedErrorHandler');
// app.use(unifiedErrorHandler);

// Start the server
server.listen(port, () => console.log(`Server is up on port ${port}`));

module.exports = { app };
