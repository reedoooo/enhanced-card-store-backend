'use strict';

// Dependencies
const express = require('express');
const helmet = require('helmet');

const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const http = require('http');

// Custom modules
const { initSocket } = require('./socket');
const { setupSocketEvents } = require('./socketEvents');
const applyCustomMiddleware = require('./middleware');
const routes = require('./routes');
const path = require('path');

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
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
  }),
);
// app.use(cors(corsOptions));

// Middleware Application
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
applyCustomMiddleware(app);

// Socket Initialization
const server = http.createServer(app);
initSocket(server);
setupSocketEvents();

// Define paths
const appDirectory = path.resolve(__dirname, '..'); // Adjust as necessary for your folder structure
const publicDirectory = path.join(appDirectory, 'public');

// Ensure the public directory exists
if (!fs.existsSync(publicDirectory)) {
  fs.mkdirSync(publicDirectory, { recursive: true });
}

app.use('/public', express.static(publicDirectory));
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
