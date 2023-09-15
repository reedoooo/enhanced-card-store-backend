const express = require('express');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');
const winston = require('winston');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const { check } = require('express-validator');
// const API_ENDPOINT = 'https://api.tcgplayer.com/app/authorize/';
// const AUTH_CODE = 'your-auth-code-here';
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded!');
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment failed!');
      break;
    default:
      return res.status(400).end();
  }

  res.json({ received: true });
};

const handleErrors = (err, req, res, next) => {
  let status = 500;
  let message = 'An unexpected error occurred';

  switch (err.name) {
    case 'ValidationError':
      status = 400;
      message = err.message;
      break;
    case 'MongoError':
      status = 400;
      message = 'Database error';
      break;
    default:
      winston.error('Unhandled error:', err); // Using winston for logging
  }

  res.status(status).json({ message });
};

exports.validate = (method) => {
  switch (method) {
    case 'createNewCollection': {
      return [
        check('name', 'Name is required').exists(),
        check('description', 'Description is required').exists(),
        check('items', 'Items is required').exists(),
        check('items', 'Items must be an array').isArray(),
        // ... other checks
      ];
    }
    case 'getAllCollectionsForUser': {
      return [
        check('name', 'Name is required').exists(),
        check('description', 'Description is required').exists(),
        check('items', 'Items is required').exists(),
        check('items', 'Items must be an array').isArray(),
        // ... other checks
      ];
    }
    case 'updateAndSyncCollection': {
      return [
        check('name', 'Name is required').exists(),
        check('description', 'Description is required').exists(),
        check('items', 'Items is required').exists(),
        check('items', 'Items must be an array').isArray(),
        // ... other checks
      ];
    }
    case 'createNewDeck': {
      return [
        check('name', 'Name is required').exists(),
        check('description', 'Description is required').exists(),
        check('cards', 'Cards is required').exists(),
        check('cards', 'Cards must be an array').isArray(),
        // ... other checks
      ];
    }
    // ... other cases
  }
};

module.exports = function applyCustomMiddleware(app) {
  console.log('App inside middleware:', app);
  console.log('Type of app inside middleware:', typeof app);
  app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.json());

  // CORS Configuration
  app.use(
    cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3000/profile',
        'http://localhost:3001/api/users/signin',
      ],
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: [
        'Content-Type',
        'access-control-allow-origin',
        'card-name',
        'Authorization',
        'User-Agent',
        'text/plain',
        'application/json',
      ],
    }),
  );

  // Error Handler
  app.use(handleErrors);

  // Stripe Webhook
  app.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
};

// const express = require('express');
// const logger = require('morgan');

// exports.validate = (method) => {
//   switch (method) {
//     case 'signup':
//       return [
//         // Signup validation rules
//       ];
//     case 'signin':
//       return [
//         // Signin validation rules
//       ];
//     // ... other cases
//   }
// };

// const authorizeApplication = async (req, res, next) => {
//   try {
//     const response = await axios.post(API_ENDPOINT + AUTH_CODE);
//     winston.info('Authorization Successful:', response.data); // Using winston for logging
//     next();
//   } catch (err) {
//     winston.error('Authorization Error:', err); // Using winston for logging
//     next(err); // Pass error to the error-handling middleware
//   }
// };

// const authorizeApplication = async (req, res, next) => {
//   const schema = Joi.object({
//     // your validation schema here
//   });

//   const { error } = schema.validate(req.body);
//   if (error) {
//     return res.status(400).json({ error: error.details[0].message });
//   }

//   next();
// };
