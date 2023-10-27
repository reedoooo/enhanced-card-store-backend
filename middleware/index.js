const express = require('express');
const path = require('path');
// const winston = require('winston');
const handleErrors = require('./errorMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const connectionLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};

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
  // app.use(logger('dev'));
  app.use(connectionLogger);
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.json());
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    handleErrors(err, req, res, next);

    res.status(500).json({ error: err.message });
  });

  app.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  app.use(handleErrors);
};
