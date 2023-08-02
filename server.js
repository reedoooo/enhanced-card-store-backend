// 'use strict';

// const express = require('express');
// const dotenv = require('dotenv');
// const mongoose = require('mongoose');
// const redis = require('redis');

// // Configure dotenv
// dotenv.config();

// // Create a redis client
// const redisClient = redis.createClient({
//   host: 'localhost', // the host where Redis server is running
//   port: 6379, // the port on which Redis server is running
// });

// redisClient.on('connect', function () {
//   console.log('Connected to Redis...');
// });

// redisClient.on('error', function (err) {
//   console.log('Redis error: ' + err);
// });

// // Import custom middleware and routes
// const applyCustomMiddleware = require('./middleware');
// const routes = require('./routes')(redisClient); // Use redisClient here

// // Prepare the express app with singleton
// const app = express();
// const port = process.env.PORT || 3002;

// //MongoDb connection
// mongoose
//   .connect(process.env.MONGODB_URL)
//   .then(() => {
//     console.log('Connected to MongoDB');
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// // Apply middleware
// applyCustomMiddleware(app);

// // HANDLE ROUTES
// app.use(
//   '/api',
//   (req, res, next) => {
//     console.log(
//       `Received request on API route: ${req.method} ${req.originalUrl}`,
//     );
//     next();
//   },
//   routes, // No need to pass redisClient again here
// );

// app.get('/', (req, res) => {
//   res.send('This is the beginning....');
// });

// app.get('/test', (req, res) => {
//   res.send('This is the test....');
// });

// //start the server
// app.listen(port, () => {
//   console.log(`Server is up on port ${port}`);
// });

// module.exports = app;

'use strict';

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Configure dotenv
dotenv.config();

// Import custom middleware and routes
const applyCustomMiddleware = require('./middleware');
const routes = require('./routes');

// Prepare the express app with singleton
const app = express();
const port = process.env.PORT || 3002;

//MongoDb connection
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

// Apply middleware
applyCustomMiddleware(app);

// HANDLE ROUTES
app.use(
  '/api',
  (req, res, next) => {
    // console.log(`Received request on API route: ${req.method} ${req.originalUrl}`);
    next();
  },
  routes,
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
