const express = require('express');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = function applyCustomMiddleware(app) {
  app.use(logger('dev'));
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.json());
  app.use(
    cors({
      origin: ['http://localhost:3000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Error handling middleware
  app.use((err, req, res, next) => {
    let status = 500;
    let message = 'An unexpected error occurred';

    if (err.name === 'ValidationError') {
      status = 400;
      message = err.message;
    } else if (err.name === 'MongoError') {
      status = 400;
      message = 'There was a problem with the database operation';
    }

    res.status(status).json({ message });
  });

  // Use express middleware to parse the payload from Stripe
  app.use(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const sig = req.headers['stripe-signature'];

      let event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the checkout.session.completed event
      switch (event.type) {
      case 'payment_intent.succeeded':
        // Payment was successful
        console.log('Payment succeeded!');
        break;
      case 'payment_intent.payment_failed':
        // Payment failed
        console.log('Payment failed!');
        break;
      default:
        // Unexpected event type
        return res.status(400).end();
      }

      // Return a response to acknowledge receipt of the event
      res.json({ received: true });
    },
  );
};
