// 'use strict';
'use strict';

// Dependencies
const express = require('express');
require('dotenv').config(); // directly call config here
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const { initSocket } = require('./socket');
const { setupSocketEvents } = require('./socketEvents.js');
const applyCustomMiddleware = require('./middleware/index');
const routes = require('./routes/index');

// Configuration
const port = process.env.PORT || 3001;

// App Initialization
const app = express();

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000', // Adjust according to your front-end origin
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
};

app.use(cors(corsOptions));

// Database Connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/yugioh')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

// Middleware Application
app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
applyCustomMiddleware(app);

// Socket Initialization
const server = require('http').Server(app);
initSocket(server);
setupSocketEvents();

// Routes
app.use('/api', routes);
app.get('/', (req, res) => res.send('This is the beginning....'));
app.get('/test', (req, res) => res.send('This is the test....'));

// Start the server
server.listen(port, () => console.log(`Server is up on port ${port}`));

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
