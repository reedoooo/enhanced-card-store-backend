const express = require('express');
const path = require('path');
const cors = require('cors');
const winston = require('winston');
const handleErrors = require('./errorMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

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

module.exports = function applyCustomMiddleware(app, server) {
  // Accepting server object here
  // app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.json());
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ error: err.message });
  });

  app.use(
    cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3000/',
        'http://localhost:3000/profile',
        'http://localhost:3000/api/users/signin',
        'http://localhost:3000/api/users/signup',
        'http://localhost:3000/api/users/:id',
        'http://localhost:3000/api/users/:userId/decks',
      ],
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: [
        'Content-Type',
        'access-control-allow-origin',
        'Access-Control-Allow-Headers',
        'card-name',
        'Authorization',
        'User-Agent',
        'text/plain',
        'application/json',
      ],
    }),
  );

  app.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  app.use(handleErrors);
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
