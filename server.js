'use strict';

// Dependencies
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');

// Custom modules
const { initSocket } = require('./socket');
const { setupSocketEvents } = require('./socketEvents');
const applyCustomMiddleware = require('./middleware');
const routes = require('./routes');

// Load environment variables
require('dotenv').config();

// Constants
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapp';

// App Initialization
const app = express();

// Define an array of allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://main--tcg-database.netlify.app/',
  'https://enhanced-cardstore.netlify.app',
  'https://enhanced-cardstore.netlify.app/',
  'https://main--enhanced-cardstore.netlify.app',
  'https://65622f40ed40a800087e43e2--enhanced-cardstore.netlify.app',
  'https://65624efffdb1c3672f781980--enhanced-cardstore.netlify.app',
];

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
};
app.use(cors(corsOptions));

// Middleware Application
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
applyCustomMiddleware(app);

// Socket Initialization
const server = http.createServer(app);
initSocket(server);
setupSocketEvents();

// API Routes
app.use('/api', routes);

// Basic routes for testing
app.get('/', (req, res) => res.send('This is the beginning....'));
app.get('/test', (req, res) => res.send('This is the test....'));

// Connect to MongoDB and start the server
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => server.listen(PORT, () => console.log(`Server listening on port ${PORT}`)))
  .catch((error) => console.error('MongoDB connection error:', error));

module.exports = { app };

// // Dependencies
// const express = require('express');
// const dotenv = require('dotenv').config(); // directly call config here
// const mongoose = require('mongoose');
// const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser'); // Added for handling larger request bodies

// const http = require('http');
// const cors = require('cors');
// const { initSocket } = require('./socket');
// const { setupSocketEvents } = require('./socketEvents.js');

// const applyCustomMiddleware = require('./middleware/index');
// const routes = require('./routes/index');

// // Configuration
// // dotenv.config();
// const port = process.env.PORT || 3001;

// // App and Server Initialization
// const app = express();
// const server = http.createServer(app);

// // Configure CORS
// const corsOptions = {
//   origin: 'http://localhost:3000', // Adjust according to your front-end origin
//   credentials: true,
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//   optionsSuccessStatus: 204,
//   allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
// };

// app.use(cors(corsOptions));

// // Database Connection
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch((err) => console.error(err));

// // Middleware Application
// app.use(express.json()); // To parse JSON bodies

// app.use(bodyParser.json({ limit: '50mb' }));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// app.use(cookieParser());
// applyCustomMiddleware(app);

// // Socket Initialization
// initSocket(server);
// setupSocketEvents();
// // Routes
// app.use('/api', routes);
// app.get('/', (req, res) => res.send('This is the beginning....'));
// app.get('/test', (req, res) => res.send('This is the test....'));

// // Error Handling Middleware
// // const unifiedErrorHandler = require('./middleware/unifiedErrorHandler');
// // app.use(unifiedErrorHandler);

// // Start the server
// server.listen(port, () => console.log(`Server is up on port ${port}`));

// module.exports = { app };
