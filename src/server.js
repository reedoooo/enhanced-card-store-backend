'use strict';

// 1. Environment and Dependencies
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const path = require('path');
const compression = require('compression');
const moment = require('moment-timezone');
moment.tz.add('America/Seattle|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');

require('./services/runCron');
const routes = require('./routes');
const handleStripePayment = require('./middleware/handleStripePayment');
const { morganMiddleware } = require('./middleware/loggers/morganMiddleware');
const { unifiedErrorHandler } = require('./middleware/errorHandling/unifiedErrorHandler');
const logger = require('./configs/winston');

require('dotenv').config({
  path: path.join(__dirname, 'configs', '.env'),
});

// 2. App Initialization
const app = express();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapp';
const environment = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3001;

process.env.TZ = 'America/Seattle';
moment.tz.setDefault('America/Seattle');

// 3. Middleware Configuration
const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morganMiddleware);
app.use(express.static(path.join(__dirname, '../public')));

// 4. Route Check Middleware
app.use((req, res, next) => {
  const path = req.originalUrl;
  if (!path.startsWith('/api') && path !== '/') {
    logger.error(`Endpoint not found for ${req.url}`);
    return res.status(404).send('Endpoint not found');
  }
  next();
});

// 5. Route Definitions
app.post('/api/stripe/checkout', handleStripePayment);
app.use('/api', routes);
// app.use(handleMongoError);
app.get('/', (req, res) => {
  res.send('Welcome to the API.');
});

// 6. Error Handling Middleware
app.use(unifiedErrorHandler);

// 7. Server and Database Initialization
const server = http.createServer(app);

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    // Different behavior based on environment
    if (environment === 'production') {
      server.listen(PORT, () => logger.info(`Server running on port ${PORT} in production mode`));
    } else {
      server.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${environment} mode`);
        if (environment === 'development') {
          logger.info('Starting in development mode with additional logging.');
        }
      });
    }
  })
  .catch((error) => logger.error('MongoDB connection error:', error));

module.exports = { app, server };
