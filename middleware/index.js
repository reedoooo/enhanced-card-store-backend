const express = require('express');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

const API_ENDPOINT = 'https://api.tcgplayer.com/app/authorize/';
const AUTH_CODE = 'asd9f8a9s8g89fsa9ahja9sdafd9s8f7d'; // Replace with actual code if necessary

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
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

  // You can add more cases for different kinds of errors here
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
      console.error('Unhandled error:', err);
  }

  res.status(status).json({ message });
};

const authorizeApplication = async (req, res, next) => {
  try {
    const response = await axios.post(API_ENDPOINT + AUTH_CODE);
    console.log('Authorization Successful:', response.data);
    next();
  } catch (err) {
    console.error('Authorization Error:', err);
    next(err); // Pass error to the error-handling middleware
  }
};

module.exports = function applyCustomMiddleware(app) {
  app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.json());

  // Only enable this if you want it for every request
  // app.use(authorizeApplication);

  app.use(
    cors({
      origin: ['http://localhost:3000'],
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: [
        'Content-Type',
        'card-name',
        'Authorization',
        'User-Agent',
        'application/json',
      ],
    })
  );

  // Error handling
  app.use(handleErrors);

  // Stripe webhook
  app.use(
    '/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
  );
};
